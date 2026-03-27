import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  DailySummaryResponse,
  SaleApiService,
} from '../../../core/services/sale-api.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

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

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css',
})
export class DashboardHomeComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);

  summary: DailySummaryResponse | null = null;
  error = '';
  loading = true;

  readonly viewW = 880;
  readonly viewH = 310;
  readonly padL = 58;
  readonly padR = 28;
  readonly padT = 40;
  readonly padB = 56;

  chartBars: ChartBar[] = [];
  maxY = 1;
  avgSalesY = 0;
  avgExpY = 0;
  innerW = 0;
  innerH = 0;
  baselineY = 0;
  yTicks: { y: number; val: number }[] = [];

  ngOnInit(): void {
    this.saleApi.dailySummary(14).subscribe({
      next: (s) => {
        this.summary = s;
        this.loading = false;
        this.buildChart();
      },
      error: (e) => {
        this.error = apiErrorMessage(e);
        this.loading = false;
      },
    });
  }

  private buildChart(): void {
    const s = this.summary;
    this.chartBars = [];
    this.yTicks = [];
    if (!s?.series?.length) {
      this.maxY = 1;
      this.innerW = this.viewW - this.padL - this.padR;
      this.innerH = this.viewH - this.padT - this.padB;
      this.baselineY = this.padT + this.innerH;
      this.avgSalesY = this.baselineY;
      this.avgExpY = this.baselineY;
      return;
    }

    const n = s.series.length;
    this.innerW = this.viewW - this.padL - this.padR;
    this.innerH = this.viewH - this.padT - this.padB;
    this.baselineY = this.padT + this.innerH;

    const peaks = s.series.flatMap((d) => [d.sales, d.expenses]);
    const dataMax = Math.max(
      ...peaks,
      s.avg_daily_sales,
      s.avg_daily_expenses,
      0,
    );
    this.maxY = Math.max(dataMax * 1.08, 1);

    const slot = this.innerW / n;
    const barW = Math.min(26, Math.max(8, slot * 0.32));

    for (let i = 0; i < n; i++) {
      const row = s.series[i];
      const cx = this.padL + slot * (i + 0.5);
      const salesH = (row.sales / this.maxY) * this.innerH;
      const expH = (row.expenses / this.maxY) * this.innerH;
      const salesY = this.padT + this.innerH - salesH;
      const expY = this.padT + this.innerH - expH;
      this.chartBars.push({
        label: this.formatDayLabel(row.date),
        labelX: cx,
        salesX: cx - barW - 2,
        expX: cx + 2,
        barW,
        salesH,
        expH,
        salesY,
        expY,
      });
    }

    this.avgSalesY =
      this.padT + this.innerH - (s.avg_daily_sales / this.maxY) * this.innerH;
    this.avgExpY =
      this.padT + this.innerH - (s.avg_daily_expenses / this.maxY) * this.innerH;

    const tickCount = 4;
    for (let t = 0; t <= tickCount; t++) {
      const frac = t / tickCount;
      const val = this.maxY * (1 - frac);
      const y = this.padT + frac * this.innerH;
      this.yTicks.push({ y, val: Math.round(val * 100) / 100 });
    }
  }

  formatDayLabel(iso: string): string {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  }
}
