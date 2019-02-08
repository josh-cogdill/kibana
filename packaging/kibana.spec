Summary:       custom logrhythm kibana
Name:          kibana
Version:       %{version}
Release:       1%{?dist}
License:       https://github.com/joyent/node/blob/master/LICENSE
Group:         Development/Tools
URL:           https://github.com/joyent/%{name}
Source:        http://nodejs.org/dist/v%{version}/%{name}-v{%version}.tar.gz
Requires:      python-elasticsearch >= 1.0.0
Requires(post): systemd

%description
kibana build for logrhythm

%prep
#cleanup
cd %_builddir
rm -rf %{name}
mkdir %{name}
cd %{name}
#extract sources
tar xzf %_sourcedir/%{name}-%{version}.tar.gz
if [ $? -ne 0 ]; then
   exit $?
fi

%build
cd %{name}
#ensure nvm is installed
NVM_DIR="%_builddir/%{name}/nvm" bash scripts/install_nvm.sh
source %_builddir/%{name}/nvm/nvm.sh
#install the correct node version locally
nvm install "$(cat .node-version)"
#install all of the dependencies
npm install

%install
#run the build
cd %{name}
source nvm/nvm.sh
nvm/v0.34.0/bin/node node_modules/grunt-cli/bin/grunt build
%install
cd %{name}
#extract the built tarball to the www location
mkdir -p %{buildroot}/usr/local/www/probe/
mkdir -p %{buildroot}/etc/init
tar xvf target/%{name}-%{kibana_version}-linux-x64.tar.gz -C %{buildroot}/usr/local/www/probe/
cp init/kibana.conf %{buildroot}/etc/init
