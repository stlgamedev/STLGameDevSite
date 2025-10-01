[![⚙ Build the Hugo Site](https://github.com/stlgamedev/STLGameDevSite/actions/workflows/hugo-build.yaml/badge.svg)](https://github.com/stlgamedev/STLGameDevSite/actions/workflows/hugo-build.yaml)

# STLGameDev Website

This is the source code for the STLGameDev Website.

The site is driven by [Hugo](https://gohugo.io/) with [Bootstrap](https://getbootstrap.com/) and [jQuery](https://jquery.com/).

The site is built by [GitHub Actions](https://github.com/stlgamedev/STLGameDevSite/actions) on pushes to the main branch and hosted as a GitHub Page at [https://stlgame.dev](https://stlgame.dev) and (eventually) [https://stlgamedev.com](https://stlgamedev.com)

## Directory

If you are a developer from the St. Louis area, and have projects you would like to share on our site, you can add them to the Directory.

### How to Add a Developer

> [!IMPORTANT]
> You *must* add a Devloper in order to add Projects.

1. Add a new file: `/data/directory/devname.yml` use all lowercase and only alpha-numeric characters in the file name.
2. The file should contain the following content:

    ```yaml
    Name: 'Developer Name'
    Website: 'https://valid.url/'
    Description: 'A short description about this developer.'
    Logo: 'logofilename.png'
    Projects:
        - projecta
        - projectb
    ```

    ==`Logo` and `Projects` should also be in all lowercase and only alpha-numeric characters.==

3. Add an image for your Developer to `/assets/images/directory` giving it the same file name you put in the `yml` file.

> [!NOTE]
> For best results, use an image that is square with a 1:1 size ratio.

### How to Add a Project

1. Add a new file: `/data/showcase/projecta.yml` using the same file name that was added to the `Projects` section of your Developer `yml` file.
2. The file should contain the following content:

    ```yaml
    Name: 'Project Name'
    Description: "A short description of your project."
    Links:
    - URL: 'https://linktoproject.site/'
        Tooltip: 'Official Website'
        Icon: "fa-sharp-duotone fa-solid fa-link"
    - URL: 'https://steamlink.site/'
        Tooltip: 'Steam'
        Icon: "fa-brands fa-steam"
    - URL: 'https://itchlink.site/'
        Tooltip: 'Itch.io'
        Icon: "fa-brands fa-itch-io"
    ```

3. Add an image to `/assets/images/directory` that has the exact same filename as your project's `yml` file, but as a `png`. It should have a size ratio of 16:9.

> [!NOTE]
> You can use as few or as many links as you want (within reason), and anything you want for the `Tooltip`. You can use any icon from [Font Awesome's Sharp Duotone or Brands packs](https://fontawesome.com/search?o=r&f=sharp-duotone%2Cbrands) for your links' `Icon`.

## Events

Events are pulled from our Google Calendar nightly.
