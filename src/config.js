// Vehicle handling profiles + fine economics.

export const SEGMENT_LENGTH = 200;
export const RUMBLE_LENGTH = 3;
export const ROAD_WIDTH = 2400;
export const TRACK_SEGMENTS = 3000;
export const FIELD_OF_VIEW = 88;

export const MEDIAN_HALF = 0.042;

// lane centres in road units (-1 .. 1 across the full carriageway)
export const LANE_X = {
  left: [-0.845, -0.56, -0.275],
  right: [0.275, 0.56, 0.845],
};

export const VEHICLES = {
  car: {
    id: 'car',
    name: 'Car',
    topKmh: 180,
    worldMax: 12000,
    accel: 1250,
    brake: 9000,
    decel: 900,
    offroadDecel: 5200,
    steer: 1.0,
    cameraHeight: 1080,
    hitW: 0.052,
    hitL: 460,
    limit: 80,
    maxPeople: 6,
    defaultPeople: 1,
    seatbelt: true,
    helmet: false,
    color: '#b8392f',
  },
  bike: {
    id: 'bike',
    name: 'Bike',
    topKmh: 150,
    worldMax: 10000,
    accel: 1500,
    brake: 7800,
    decel: 1100,
    offroadDecel: 5200,
    steer: 1.16,
    cameraHeight: 900,
    hitW: 0.03,
    hitL: 230,
    limit: 80,
    maxPeople: 4,
    defaultPeople: 1,
    seatbelt: false,
    helmet: true,
    color: '#2f7dc4',
  },
};

export const FINE_RULES = {
  noSeatbelt: { amount: 1000 },
  noHelmet: { amount: 1000 },
  tripleRide: { amount: 2500 },
  overloading: { amount: 3000 },
  overspeed: { amount: 3000 },
  signal: { amount: 3000 },
  wrongSide: { amount: 10000 },
  rough: { amount: 5000 },
  accident: { amount: 5000 },
  damage: { amount: 0 },
  noLicense: { amount: 25000 },
  fled: { amount: 3000 },
  noStop: { amount: 5000 },
};

export const LICENSE_SURCHARGE = 0.5;
