#!/bin/bash

# check if current dir = ~/grass
if [ "$PWD" == "$HOME/grass" ]; then
  echo "This script cannot be run from the ~/grass directory. Please run it from a different directory."
  exit 1
fi

# get all args
# "proxyString1" "username1" "password1" "proxyString2" "username2" "password2" ...
args=("$@")

# Check if the number of arguments is not a multiple of 3
if [ $((${#args[@]} % 3)) -ne 0 ]; then
  echo "The number of arguments is not a multiple of 3."
  exit 1
fi

if [ -z "${args[*]}" ]; then
  echo "The array is empty."
  exit 1
fi

proxyStrings=()
usernames=()
passwords=()

# Iterate through the args array
for ((i = 0; i < ${#args[@]}; i += 3)); do
  # validate proxy string format
  IFS=':' read -ra proxyParts <<<"${args[i]}"
  if [ ${#proxyParts[@]} -ne 4 ]; then
    echo "Invalid proxy string format. Expected 'host:port:username:password'."
    exit 1
  fi

  proxyStrings+=("${args[i]}")
  usernames+=("${args[i + 1]}")
  passwords+=("${args[i + 2]}")
done

# sudo used to ensure the user is asked for the password from the start
sudo echo "#############################"
echo "Starting..."
echo "#############################"

#stop grass docker container
docker stop grass
# delete grass docker container
docker rm grass
# delete grass_image docker image
docker image rm grass_image

parentDir="$HOME/grass"
sudo rm -rf $parentDir
sudo mkdir $parentDir
sudo mkdir "$parentDir/chrome_profiles"

# create a dir for node and copy js files there
srcdir="$parentDir/src"
sudo mkdir -p $srcdir
cp -r ./src $parentDir

currentdir=$PWD

# Update apt
echo "#############################"
echo "Updating apt..."
echo "#############################"
sudo apt update
sudo apt upgrade

# Ensure wget is installed
if ! command -v wget &>/dev/null; then
  # Install wget
  echo "wget is not installed. Installing it..."

  # Use the package manager appropriate for your system (e.g., apt, yum, pacman)
  # Replace the following line with the package manager command for your system
  sudo apt-get install -y wget

  # Check if installation was successful
  if [ $? -eq 0 ]; then
    echo "wget has been successfully installed."
  else
    echo "Failed to install wget. Please install it manually."
    exit 1
  fi
fi

# Install unzip
echo "#############################"
echo "Installing unzip..."
echo "#############################"
sudo apt-get install -y unzip

# Install virtual display
echo "#############################"
echo "Installing virtual display..."
echo "#############################"
sudo apt-get install -y xvfb

# Install Docker
echo "#############################"
echo "Installing Docker..."
echo "#############################"
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
sudo apt-get install -y docker-ce

# Install Google Chrome
echo "#############################"
echo "Installing Google Chrome..."
echo "#############################"
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt-get install -f

# Install Node.js (from https://github.com/nodesource/distributions?tab=readme-ov-file#installation-instructions)
echo "#############################"
echo "Installing Node.js..."
echo "#############################"
# 1. Download and import the Nodesource GPG key
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
sudo rm -f /etc/apt/keyrings/nodesource.gpg # Add this line
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
# 2. Create deb repository
NODE_MAJOR=20
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
# 3. Run Update and Install
sudo apt-get update
sudo apt-get install nodejs -y

echo "#############################"
echo "Installing dependencies..."
echo "#############################"
cd $srcdir
npm install

# Start Xvfb and save its PID to a file
Xvfb :99 -screen 0 800x600x24 &
echo $! >/tmp/xvfb.pid

# Set the DISPLAY environment variable to use the Xvfb display
export DISPLAY=:99

echo "#############################"
echo "Downloading extension..."
echo "#############################"
mkdir -p "$parentDir/extension"
touch "$parentDir/extension/version.txt"
node download-extension.js "$parentDir/extension"

# echo "#############################"
# echo "Configuring profiles..."
# echo "#############################"
# # Loop over the usernames and passwords
# for i in ${!usernames[@]}; do
#   username=${usernames[$i]}
#   password=${passwords[$i]}

#   echo "Profile $i being configured. Signing into $username..."

#   # Create a new user data directory
#   dir="$parentDir/chrome_profiles/$i"
#   mkdir -p $dir

#   # Run the Puppeteer script to configure the profile
#   node configure-profile.js $dir "$parentDir/extension/grass-extension" $username $password
# done

# Kill the Xvfb process
kill $(cat /tmp/xvfb.pid)

cd $currentdir

echo "" >>"$parentDir/src/start.sh"
{
  printf "xvfb-run --server-args=\"-screen 0 800x600x24\" node src/index.js ./extension ./chrome_profiles"
  for arg in "${args[@]}"; do
    printf " '%s'" "$arg"
  done
} >>"$parentDir/src/start.sh"

echo "#############################"
echo "Building..."
echo "#############################"
docker build -t grass_image "$parentDir/src"

echo "#############################"
echo "Running..."
echo "#############################"
docker run --restart=always --name grass -v "$parentDir":/app grass_image
