with open('main.py', 'r') as f:
    content = f.read()

import re

# We will replace the entire block starting from `import os` up to `if __name__ == "__main__":`
pattern = r"    import os\s+from fastapi\.staticfiles import StaticFiles.*?if __name__ == \"__main__\":"

replacement = '''
    import os
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    if os.path.exists("dist"):
        app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
        
        @app.get("/")
        @app.get("/{full_path:path}")
        def serve_react_app(full_path: str = ""):
            if full_path and os.path.exists(f"dist/{full_path}") and os.path.isfile(f"dist/{full_path}"):
                return FileResponse(f"dist/{full_path}")
            return FileResponse("dist/index.html")
    else:
        @app.get("/")
        @app.get("/{full_path:path}")
        def no_dist(full_path: str = ""):
            return {"error": "The dist folder does not exist. Run 'npm run build' first."}

if __name__ == "__main__":'''

new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('main.py', 'w') as f:
    f.write(new_content)
