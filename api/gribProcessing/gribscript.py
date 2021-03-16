import Nio
import Ngl
import numpy
import types
import json
import sys
import os

#File paths are with respect to node.js parent process
#pls = sys.stdin.read()

directory = os.fsencode("./gribfiles")

temperatureData = []

for file in sorted(os.listdir(directory)):
    path = os.path.join(directory,file)
    
    grib = Nio.open_file(path.decode('utf8'),"r")

    #Does this variable name ever change?
    temperature = grib.variables['TMP_P0_L103_GLL0'][0:].tolist()

    temperatureData.append(temperature)

    

#Write data to a file
with open("../temperatureData.json", "w") as f:
    json.dump(temperatureData, f)
    



















