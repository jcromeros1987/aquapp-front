FROM node:21

RUN npm install -g @angular/cli

#WORKDIR /
# RUN mkdir aquapp-front
WORKDIR /aquapp-front


#CMD ng new $APP_NAME --routing=$ROUTING --standalone=$STANDALONE --strict=$STRICT --style=$STYLE \
#    && mv $APP_NAME/* . \
#    && rm -rf $APP_NAME \
#    && ng serve --host 0.0.0.0 --port 4200
CMD ng serve --poll=2000 --host 0.0.0.0 --port 4200
#CMD npm run

EXPOSE 4200