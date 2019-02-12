Summary:       custom logrhythm kibana
Name:          kibana
Version:       %{version}
Release:       1%{?dist}
License:       https://github.com/joyent/node/blob/master/LICENSE
Group:         Development/Tools
URL:           https://github.com/joyent/%{name}
Source:        http://nodejs.org/dist/v%{version}/%{name}-v{%version}.tar.gz
Requires:      python-elasticsearch >= 6.0.0
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
#sed command to change kibana port number
sed 's/5602/5601/' config/kibana.yml > tmp.out && mv tmp.out config/kibana.yml
#ensure nvm is installed
NVM_DIR="%_builddir/%{name}/nvm" bash scripts/kibanaSpecHelper_install_nvm.sh
source %_builddir/%{name}/nvm/nvm.sh
#install the correct node version locally
nvm install "$(cat .node-version)"
#install all of the dependencies
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg
sudo yum install yarn
yarn --version
yarn kbn clean
#yarn test:quick
#npm install -g grunt-cli

%build
#run the build
cd %{name}
yarn kbn bootstrap
#source nvm/nvm.sh
#nvm/v0.34.0/bin/node #node_modules/grunt-cli/bin/grunt build

%install
cd %{name}
#extract the built tarball to the www location
mkdir -p %{buildroot}/usr/local/www/probe/
mkdir -p %{buildroot}/etc/init
tar xvf target/%{name}-%{kibana_version}-linux-x86_64.tar.gz -C %{buildroot}/usr/local/www/probe/
cp init/kibana.conf %{buildroot}/etc/init

%post

%postun

%files
%defattr(-,nginx,nginx,-)
/usr/local/www/probe/%{name}-%{kibana_version}-linux-x86_64
%attr(0644,root,root) /etc/init/kibana.conf
