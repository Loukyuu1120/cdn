sudo sed -i 's/^export TMOUT=.*/export TMOUT=0/' /etc/profile &&sudo sed -i "/#ClientAliveInterval/a\ClientAliveInterval 30" /etc/ssh/sshd_config &&sudo sed -i "/#ClientAliveInterval/d" /etc/ssh/sshd_config &&sudo sed -i "/#ClientAliveCountMax/a\ClientAliveCountMax 86400" /etc/ssh/sshd_config &&sudo sed -i "/#ClientAliveCountMax/d" /etc/ssh/sshd_config &&sudo /bin/systemctl restart sshd.service

sudo sed -i 's/^.*PermitRootLogin.*/PermitRootLogin yes/g' /etc/ssh/sshd_config
sudo sed -i 's/^.*PasswordAuthentication.*/PasswordAuthentication yes/g' /etc/ssh/sshd_config
echo root: | sudo chpasswd
sudo service ssh restart
