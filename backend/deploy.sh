rsync -r --progress --exclude 'node_modules' --exclude 'posts' --exclude 'log' -e "ssh -i /Users/c/Desktop/project/decentral_online_voting_20210109/credentials/20220315_rix_data.pem" \
       /Users/c/Desktop/project/decentral_online_voting_20210109/stated/backend/* ubuntu@stated.rixdata.net:~ & \
rsync -r --progress --exclude 'node_modules' --exclude 'posts' --exclude 'log' -e "ssh -i /Users/c/Desktop/project/decentral_online_voting_20210109/credentials/20220315_rix_data.pem" \
       /Users/c/Desktop/project/decentral_online_voting_20210109/stated/backend/* ubuntu@stated.gritapp.info:~