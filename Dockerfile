FROM keymetrics/pm2:latest-stretch

RUN mkdir /opt/pouchy-store
WORKDIR /opt/pouchy-store
COPY ["package.json", "package-lock.json*", "ecosystem.config.js", "./"]
# Bundle APP files
COPY . .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production
RUN npm install --production

# Expose the listening port of your app
EXPOSE 3000

# Show current folder structure in logs
#RUN ls -al -R

#"/bin/bash", "-c", 
ENTRYPOINT ["pm2-runtime", "start", "ecosystem.config.js"]
#CMD [ "--env-file", "./.env"]