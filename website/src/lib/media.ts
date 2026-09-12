/**
 * Demo photography for the Wellness Lodge presentation build.
 *
 * SAMPLE CONTENT: every URL below is a freely-licensed stock photo (Unsplash),
 * hot-linked for demo purposes only, so the site has real imagery to show the
 * client instead of "Photo pending" placeholders. Replace every entry here
 * with the lodge's own photography before launch — see
 * docs/CONTENT_CHECKLIST_STATUS.md.
 *
 * Images are addressed by stable Unsplash photo id via images.unsplash.com,
 * with width/quality query params for responsive, fast-loading images.
 */

function unsplash(id: string, w = 1200, q = 80) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=${q}`;
}

// Big, atmospheric shots for hero / section backgrounds.
export const HERO_IMAGES = {
  homeHero: unsplash("photo-1571896349842-33c89424de2d", 1800), // resort pool at dusk
  homeSecondary: unsplash("photo-1520250497591-112f2f40a3f4", 1200), // lounge deck
  rooms: unsplash("photo-1566073771259-6a8506099945", 1800), // infinity pool / resort
  services: unsplash("photo-1445019980597-93fa8acb246c", 1800), // resort grounds
  carRental: unsplash("photo-1503376780353-7e6692767b70", 1800), // car on scenic road
  functionHall: unsplash("photo-1519167758481-83f550bb49b3", 1800), // banquet hall set for event
  restaurant: unsplash("photo-1517248135467-4c7edcad34c4", 1800), // restaurant interior
  pastEvents: unsplash("photo-1551963474-cc9e699de3b4", 1800), // wedding celebration, PNG couple
  about: unsplash("photo-1571003123894-1f0594d2b5d9", 1800), // lodge exterior / veranda
  contact: unsplash("photo-1445019980597-93fa8acb246c", 1600),
};

// Room categories, keyed by the seed's category slug/id.
export const ROOM_IMAGES: Record<string, string[]> = {
  "garden-view-room": [
    unsplash("photo-1590490360182-c33d57733427"),
    unsplash("photo-1522771739844-6a9f6d5f14af"),
  ],
  "deluxe-room": [
    unsplash("photo-1611892440504-42a792e24d32"),
    unsplash("photo-1566665797739-1674de7a421a"),
  ],
  "rainforest-suite": [
    unsplash("photo-1615880484746-a134be9a6ecf"),
    unsplash("photo-1582719478250-c89cae4dc85b"),
  ],
  "family-suite": [
    unsplash("photo-1631844820835-e698dc518bc6"),
    unsplash("photo-1560448204-e02f11c3d0e2"),
  ],
};
export const ROOM_IMAGE_FALLBACK = unsplash("photo-1611892440504-42a792e24d32");

export const VEHICLE_IMAGES: Record<string, string> = {
  "sedan-standard": unsplash("photo-1494905998402-395d579af36f"),
  "suv-4x4": unsplash("photo-1533473359331-0135ef1b58bf"),
  "van-group": unsplash("photo-1533106418989-88406c7cc8ca"),
};
export const VEHICLE_IMAGE_FALLBACK = unsplash("photo-1503376780353-7e6692767b70");

export const HALL_IMAGES: Record<string, string> = {
  "half-day-hire": unsplash("photo-1519225421980-715cb0215aed"),
  "full-day-wedding": unsplash("photo-1606217239582-d9f72323bcd7"),
};
export const HALL_IMAGE_FALLBACK = unsplash("photo-1519167758481-83f550bb49b3");

// pe1-pe6 (Wedding, Conference, Anniversary, Birthday, Engagement, Christening) use photos
// of PNG/Melanesian guests in modern, professional dress rather than
// generic stock or tribal imagery, matching the lodge's real clientele for
// the client demo.
export const PAST_EVENT_IMAGES: Record<string, string[]> = {
  pe1: [
    unsplash("photo-1606217239582-d9f72323bcd7"),
    unsplash("photo-1603214924133-5c2c78471b73"),
    unsplash("photo-1621829845053-c8114fc01eb3"),
  ],
  pe2: [
    unsplash("photo-1573164574572-cb89e39749b4"),
    unsplash("photo-1573164574511-73c773193279"),
    unsplash("photo-1573497491208-6b1acb260507"),
  ],
  pe3: [
    unsplash("photo-1551963319-13ff32a5acd1"),
    unsplash("photo-1719499683843-721331f2495f"),
    unsplash("photo-1739578874534-57d5aecd04f4"),
  ],
  pe4: [
    unsplash("photo-1648090328043-e75292e328ec"),
    unsplash("photo-1648090319889-73787d9b3f14"),
    unsplash("photo-1656450552703-83ea08a43263"),
  ],
  pe5: [
    unsplash("photo-1719499719196-7a256956a22b"),
    unsplash("photo-1718997534125-052b2ff48cd0"),
    unsplash("photo-1645827042168-4fb0cdd0bf7e"),
  ],
  pe6: [
    unsplash("photo-1731743215053-53eb81151f60"),
    unsplash("photo-1731743214989-9b4d60937ddf"),
    unsplash("photo-1731743214318-e259c46f6b2c"),
  ],
};
export const PAST_EVENT_FALLBACK = unsplash("photo-1606217239582-d9f72323bcd7");

export const GALLERY_STRIP = [
  unsplash("photo-1566073771259-6a8506099945", 900),
  unsplash("photo-1611892440504-42a792e24d32", 900),
  unsplash("photo-1519167758481-83f550bb49b3", 900),
  unsplash("photo-1517248135467-4c7edcad34c4", 900),
  unsplash("photo-1606217239582-d9f72323bcd7", 900),
  unsplash("photo-1503376780353-7e6692767b70", 900),
];

export const RESTAURANT_IMAGES = [
  unsplash("photo-1517248135467-4c7edcad34c4", 1200),
  unsplash("photo-1414235077428-338989a2e8c0", 1200),
  unsplash("photo-1544148103-0773bf10d330", 1200),
];
