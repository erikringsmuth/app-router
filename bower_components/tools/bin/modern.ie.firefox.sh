runFirefox() {
  VBoxManage guestcontrol "IE10 - Win8" exec --username IEUser --image "C:\\Program Files\\Mozilla Firefox\\firefox.exe" --password 'Passw0rd!' --wait-exit -- "$1"
}

killFirefox() {
  VBoxManage guestcontrol "IE10 - Win8" exec --username IEUser --image "C:\\Windows\\system32\\taskkill.exe" --password 'Passw0rd!' --wait-exit -- /IM firefox.exe /F
}

trap "killFirefox; exit 0" EXIT

url=$1
runFirefox "${url/localhost/10.0.2.2}"
