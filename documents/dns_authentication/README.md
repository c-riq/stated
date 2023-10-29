### Publishing statments using DNS authentication

Add the statement's URL-safe-base64 encoded hash as a TXT record for the subdomain  `stated.` in your DNS domain records, such that it can be verified by shell commands such as:
```bash
dig -t txt stated.rixdata.net +short | grep NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA
# with DNSSEC
delv @1.1.1.1 TXT stated.rixdata.net +short +trust | grep -e 'fully validated' -e 'NF6irhgDU0F_HEgTRKnhnDlA2R8c9YnjihhiCyNGsQA'
```
and then publish the full text of the statement statement through another organisations [stated web app](https://stated.rixdata.net/create-statement).
