### Publish statements using Github pages for hosting

Summary based on https://docs.github.com/en/pages/quickstart

- Create a public repository on github.com with the name `username.github.io` (replacing 'username' with your actual Github user name)
- In the repository `Settings` click on `Pages`
- Select deploy from branch and select main or master
- In your domain registrar (namecheap, godaddy etc.) settings, add a CNAME record, pointing static.stated.your-organisation.com to your-github-username.github.io. (make sure to include the trailing `.` in the end).
- In the Github Pages settings enter static.stated.your-organisation.com in the Custom domain field
- Wait for the DNS check to finish, this may take some time and may require retries (with some domain name registrars this may take up to 24 hours but usually only takes a few minutes)
- Wait for the SSL certificate to be generated (optionally select option to enforce HTTPS)
- In the Code section of the repository, add a directory named `statements`
- Then add a text file containing a statement inside the `statements` directory and commit the changes to the main/master branch
- Wait until the changes are deployed, this typically takes 1 minute, and the progress can be checked under Github actions
- Check if it appears on https://static.stated.your-organisation.com/statements
