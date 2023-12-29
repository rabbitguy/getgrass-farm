FROM node:20

WORKDIR /app

# Install utilities
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# # Install Xvfb
RUN apt-get update && apt-get install -y xvfb

# Add Google Chrome's public key
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -

# Add Google Chrome to the APT sources
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list

# Install Google Chrome
RUN apt-get update && apt-get install -y \
  google-chrome-stable \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

RUN ls

COPY . .

# Set the DISPLAY environment variable
ENV DISPLAY=:99

ADD start.sh /start.sh
RUN chmod a+x /start.sh

# Run the start.sh script when the Docker container starts
CMD ["/start.sh"]