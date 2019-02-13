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
#ensure nvm is installed - not sure if node commands are necessary
NVM_DIR="%_builddir/%{name}/nvm" bash scripts/kibanaSpecHelper_install_nvm.sh
source %_builddir/%{name}/nvm/nvm.sh
#install the correct node version locally
nvm install "$(cat .node-version)"
#install all of the dependencies
curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | sudo tee /etc/yum.repos.d/yarn.repo
sudo rpm --import https://dl.yarnpkg.com/rpm/pubkey.gpg
sudo yum install yarn
yarn --version

%build
#run the build
cd %{name}
yarn kbn bootstrap

%install
cd %{name}
#extract the built tarball to the www location
mkdir -p %{buildroot}/usr/local/www/probe/
mkdir -p %{buildroot}/lib/systemd/system
tar xf target/%{name}-%{kibana_version}-linux-x86_64.tar.gz -C %{buildroot}/usr/local/
cp systemd/kibana.service %{buildroot}/lib/systemd/system
#cp -r resources/ %{buildroot}/usr/local/%{name}-%{kibana_version}-linux-x64/
mkdir -p %{buildroot}/usr/local/%{name}-%{kibana_version}-linux-x64/scripts
#cp scripts/setDefaultIndex.py %{buildroot}/usr/local/%{name}-%{kibana_version}-linux-x64/scripts
#cp scripts/loadAssets.py %{buildroot}/usr/local/%{name}-%{kibana_version}-linux-x64/scripts
#cp scripts/util.py %{buildroot}/usr/local/%{name}-%{kibana_version}-linux-x64/scripts
ln -sf /usr/local/%{name}-%{kibana_version}-linux-x86_64 %{buildroot}/usr/local/www/probe/%{name}-%{kibana_version}-linux-x86_64

%post
/usr/bin/systemctl enable kibana.service

%postun

%files
%defattr(-,nginx,nginx,-)
/usr/local/www/probe/
/usr/local/%{name}-%{kibana_version}-linux-x86_64
%attr(0644,root,root) /lib/systemd/system/kibana.service
