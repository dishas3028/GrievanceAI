
import os
try:
    with open("test.txt", "w") as f:
        f.write("Python is working")
    print("Success")
except Exception as e:
    print(f"Error: {e}")
