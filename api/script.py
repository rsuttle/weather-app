import matplotlib.pyplot as plt
import numpy as np
import pyart
import inspect
import json

radar = pyart.io.read("./KIWAradarAws2")

grid = pyart.map.grid_from_radars(radar, grid_shape=(41, 401, 401),
                                  grid_limits=((0., 20000,), (-200000., 200000.), (-200000, 200000.))
                                  ,fields=['reflectivity'])


np.set_printoptions(suppress=True)

#2d array of reflectivity values. Each value in the array is the maximum value along the z-axis(height).
#(composite reflectivity)
arrayOfReflectivityValues = grid.fields['reflectivity']['data'].max(axis=0).filled(0).tolist()


#Write data to a file
with open("./compositeReflectivity2.json", "w") as f:
    json.dump(arrayOfReflectivityValues, f)

