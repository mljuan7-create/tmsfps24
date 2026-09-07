with open('main.py', 'r') as f:
    content = f.read()

import re

# The block to append at the end of the FastAPI route declarations
static_serving = '''
    import os
    from fastapi.staticfiles import StaticFiles

    # Serve the static assets
    if os.path.exists("dist"):
        app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
        
        @app.get("/{full_path:path}")
        def serve_react_app(full_path: str):
            if os.path.exists(f"dist/{full_path}") and os.path.isfile(f"dist/{full_path}"):
                return FileResponse(f"dist/{full_path}")
            return FileResponse("dist/index.html")
    else:
        @app.get("/{full_path:path}")
        def no_dist(full_path: str):
            return {"error": "The dist folder does not exist. Run 'npm run build' first."}

'''

idx = content.find('if __name__ == "__main__":')
if idx != -1:
    content = content[:idx] + static_serving + content[idx:]

with open('main.py', 'w') as f:
    f.write(content)
