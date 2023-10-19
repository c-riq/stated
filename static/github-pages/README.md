### Publish statements using Github pages for hosting

Summary based on https://docs.github.com/en/pages/quickstart

- Create a public repository on github.com
- In the repository 'Settings' click on 'Pages'
- Select deploy from branch and select main or master
- In your domain registrar (namecheap, godaddy etc.) settings, add a CNAME record, pointing static.stated.your-organisation.com  to your-github-username.github.io. 
- In the Github Pages settings enter static.stated.your-organisation.com in the Custom domain field
- Wait for the DNS check to finish, this may take some time and may require retries
- Wait for the SSL certificate to be generated (optionally select option to enforce HTTPS)
- Add statements.txt to the root directory
- Check if they appear on https://static.stated.your-organisation.com/statements.txt
