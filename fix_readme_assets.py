import shutil, os

# read the readme.html content
with open('ShackDB/views/docs.html', 'r') as file :
  filedata = file.read()

# replace the readme assets folder
filedata = filedata.replace("readme_assets/", "/readme_assets/")

# write the file out again
with open('ShackDB/views/docs.html', 'w') as file:
  file.write(filedata)

# copy readme screenshots
if os.path.exists('ShackDB/views/public/readme_assets'):
    shutil.rmtree('ShackDB/views/public/readme_assets')
shutil.copytree('readme_assets', 'ShackDB/views/public/readme_assets')