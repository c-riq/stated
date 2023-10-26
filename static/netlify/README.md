### Publish statements using Netlify for hosting

- Create a folder containing a `index.html` file and a folder named `statements` which contains your organisations statements as `.txt` files
- Compress the main folder as a `.zip` file
- Upload the zip file in the Netlify web app under the `sites` section, when logged into your Netlify account
- Configure the new project to be linked to your `static.stated.` subdomain, which requires adding a `CNAME` entry in your Domain name settings in your domain registrar / domain name server provider (this may take a few minutes and retries)
- Configure a TLS/SSL certificate for enabling more secure HTTPS connections (this may also take some time and a few retries)
- Verify that you can access statements under https://static.stated.<your-domain.com>/statements/<statement_id>.txt
