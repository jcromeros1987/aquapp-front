import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DailySummaryResponse,
  SaleApiService,
} from '../../../core/services/sale-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error';
import {
  bucketAverages,
  buildHomeChartSeries,
  daysToFetchForGranularity,
  HomeChartGranularity,
} from './dashboard-home-chart-aggregate';

interface ChartBar {
  label: string;
  labelX: number;
  salesX: number;
  expX: number;
  barW: number;
  salesH: number;
  expH: number;
  salesY: number;
  expY: number;
}

interface PeriodTotals {
  totalSales: number;
  totalExpenses: number;
}

const GRANULARITY_OPTIONS: { id: HomeChartGranularity; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
];

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
})
export class DashboardHomeComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);
  private readonly auth = inject(AuthService);

  /** Enlace a gestión de usuarios (misma pantalla que Personal) solo para rol `admin`. */
  isAdmin = false;

  summary: DailySummaryResponse | null = null;
  granularity: HomeChartGranularity = 'day';
  readonly granularityOpts = GRANULARITY_OPTIONS;
  error = '';
  loading = true;
  /** Recarga de datos al cambiar granularidad (sin ocultar toda la tarjeta). */
  chartPending = false;

  chartViewW = 880;
  /** Promedio por bucket (día / semana / mes / año) para líneas y cifras. */
  chartAvgSales = 0;
  chartAvgExp = 0;

  readonly viewW = 880;
  readonly viewH = 310;
  readonly padL = 58;
  readonly padR = 28;
  readonly padT = 40;
  readonly padB = 56;

  chartBars: ChartBar[] = [];
  maxY = 1;
  periodTotals: PeriodTotals | null = null;
  avgSalesY = 0;
  avgExpY = 0;
  innerW = 0;
  innerH = 0;
  baselineY = 0;
  yTicks: { y: number; val: number }[] = [];

  ngOnInit(): void {
    this.isAdmin = this.auth.isAdmin();
    this.reloadSummary();
  }

  setGranularity(g: HomeChartGranularity): void {
    if (g === this.granularity || this.chartPending || this.loading) {
      return;
    }
    this.granularity = g;
    this.reloadSummary();
  }

  mediaIngresosLabel(): string {
    const u = { day: 'día', week: 'semana', month: 'mes', year: 'año' }[
      this.granularity
    ];
    return `Media ingresos / ${u}`;
  }

  mediaGastosLabel(): string {
    const u = { day: 'día', week: 'semana', month: 'mes', year: 'año' }[
      this.granularity
    ];
    return `Media gastos / ${u}`;
  }

  chartSubtitle(): string {
    switch (this.granularity) {
      case 'day':
        return 'Por día · últimos 14 días';
      case 'week':
        return 'Por semana (lun–dom) · últimas 12 semanas';
      case 'month':
        return 'Por mes calendario · últimos 12 meses';
      case 'year':
        return 'Por año · últimos 5 años';
      default:
        return '';
    }
  }

  private reloadSummary(): void {
    const firstLoad = this.summary === null;
    if (firstLoad) {
      this.loading = true;
    } else {
      this.chartPending = true;
    }
    this.error = '';
    const days = daysToFetchForGranularity(this.granularity);
    this.saleApi.dailySummary(days).subscribe({
      next: (s) => {
        this.summary = s;
        this.loading = false;
        this.chartPending = false;
        this.buildChart();
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.loading = false;
        this.chartPending = false;
      },
    });
  }

  private buildChart(): void {
    const s = this.summary;
    this.chartBars = [];
    this.yTicks = [];
    if (!s?.series?.length) {
      this.maxY = 1;
      this.periodTotals = null;
      this.chartViewW = this.viewW;
      this.innerW = this.chartViewW - this.padL - this.padR;
      this.innerH = this.viewH - this.padT - this.padB;
      this.baselineY = this.padT + this.innerH;
      this.avgSalesY = this.baselineY;
      this.avgExpY = this.baselineY;
      this.chartAvgSales = 0;
      this.chartAvgExp = 0;
      return;
    }

    const points = buildHomeChartSeries(s.series, this.granularity);
    const { avgSales, avgExp } = bucketAverages(points);
    this.chartAvgSales = avgSales;
    this.chartAvgExp = avgExp;

    const n = points.length;
    const minSlot = 32;
    this.chartViewW = Math.max(
      this.viewW,
      Math.min(2400, this.padL + this.padR + n * minSlot),
    );
    this.innerW = this.chartViewW - this.padL - this.padR;
    this.innerH = this.viewH - this.padT - this.padB;
    this.baselineY = this.padT + this.innerH;

    let sumSales = 0;
    let sumExp = 0;
    const peaks: number[] = [];
    for (const d of s.series) {
      sumSales += d.sales;
      sumExp += d.expenses;
    }
    this.periodTotals = {
      totalSales: Math.round(sumSales * 100) / 100,
      totalExpenses: Math.round(sumExp * 100) / 100,
    };

    for (const p of points) {
      peaks.push(p.sales, p.expenses);
    }
    const dataMax = Math.max(...peaks, avgSales, avgExp, 0);
    this.maxY = Math.max(dataMax * 1.08, 1);

    const slot = this.innerW / n;
    const barW = Math.min(22, Math.max(7, slot * 0.28));

    for (let i = 0; i < n; i++) {
      const row = points[i];
      const cx = this.padL + slot * (i + 0.5);
      const salesH = (row.sales / this.maxY) * this.innerH;
      const expH = (row.expenses / this.maxY) * this.innerH;
      const salesY = this.padT + this.innerH - salesH;
      const expY = this.padT + this.innerH - expH;
      const gap = Math.min(4, Math.max(1, barW * 0.12));
      this.chartBars.push({
        label: row.label,
        labelX: cx,
        salesX: cx - barW - gap / 2,
        expX: cx + gap / 2,
        barW,
        salesH,
        expH,
        salesY,
        expY,
      });
    }

    this.avgSalesY =
      this.padT + this.innerH - (avgSales / this.maxY) * this.innerH;
    this.avgExpY =
      this.padT + this.innerH - (avgExp / this.maxY) * this.innerH;

    const tickCount = 4;
    for (let t = 0; t <= tickCount; t++) {
      const frac = t / tickCount;
      const val = this.maxY * (1 - frac);
      const y = this.padT + frac * this.innerH;
      this.yTicks.push({ y, val: Math.round(val * 100) / 100 });
    }
  }
}
