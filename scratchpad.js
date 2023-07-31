let itemTokenSettings = {
    name: "MyNew Token",
    disposition: 0,
    displayName: 30,
    flags: {loadouts: {"item": "testid"}},
    x: 900,
    y: 900,
    rotation: 0
}

await canvas.scene.createEmbeddedDocuments("Token", [itemTokenSettings])


