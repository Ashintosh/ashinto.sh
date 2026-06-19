# Hugo Cheat Sheet

A quick reference for commonly used Hugo commands.

## Running the Server

Install Hugo and Go: `sudo pacman -S hugo go dart-sass`

| Command          | Description                         |
|------------------|-------------------------------------|
| `hugo server`    | Run Hugo development server         |
| `hugo server -D` | Run server **showing drafts**       |
| `hugo server -F` | Run server **showing future posts** |

## Creating Content

| Command                                          | Description                                                              |
|--------------------------------------------------|--------------------------------------------------------------------------|
| `hugo new blog/[POST-NAME]/index.md --kind blog` | Create a **new blog post** as a folder bundle using the `blog` archetype |

# Module Management

| Command         | Description                    |
|-----------------|--------------------------------|
| `hugo mod get`  | Install or update Hugo modules |
| `hugo mod tidy` | Remove unused modules          |

## Tips

- Draft posts required `-D` to show.
- Future-dated posts required `-F` to show.
- Use folder bundles (`index.md`) for posts if you want per-post images or assets.
- Put global images in `static/images/`, post-specific images in the post folder.