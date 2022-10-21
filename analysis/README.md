## Download wikidata
Check https://www.wikidata.org/wiki/Wikidata:Database_download and consider using acatemictorrents for downloading the latest wikidata dump, which is about 100 GB as compressed json. The uncompressed file is very large (~ 600 GB) but for processing the data it is not required to uncompress the whole file.

## Setup virtual environment
```
python3 -m venv stated_analysis
source stated_analysis/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt 
```

## Extracting website domains
Inside the activated virtual environement run
```
python extract_organisation_urls_from_wikidata_dump.py
```

## Data transformation and analysis via jupyter notebooks
Inside the activated virtual environement run
```
jupyter lab
```
