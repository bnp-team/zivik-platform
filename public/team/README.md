# Team portraits

Drop a square image here – 560×560, `.jpg` or `.webp`, around 30 KB – and name
the file after the person, in Latin script and lowercase: `denkovych.jpg`.

Then add the path to that person's entry in `src/content/team.ts`:

    {
      name: { uk: "Ольга Денькович", en: "Olha Denkovych" },
      role: { uk: "Координаторка проєкту", en: "Project Coordinator" },
      photo: "/team/denkovych.jpg",
    },

The field is optional. People without one render without a portrait, so the
photographs can arrive one at a time rather than all at once.
