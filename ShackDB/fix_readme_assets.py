import shutil, os

# read the readme.html content
with open('views/docs.html', 'r') as file :
  filedata = file.read()

# replace the readme assets folder
filedata = filedata.replace("readme_assets/", "/readme_assets/")

# write the file out again
with open('views/docs.html', 'w') as file:
  file.write(filedata)

# copy readme screenshots
if os.path.exists('views/public/readme_assets'):
    shutil.rmtree('views/public/readme_assets')
shutil.copytree('readme_assets', 'views/public/readme_assets')