import { afterEach, describe, expect, it, vi } from 'vitest';
import { SingaporeWeatherClient } from './weather.js';

// Trimmed copy of the live https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast shape.
const twoHourForecast = {
  code: 0,
  data: {
    area_metadata: [
      { name: 'Bedok', label_location: { latitude: 1.321, longitude: 103.924 } },
      { name: 'Bishan', label_location: { latitude: 1.350772, longitude: 103.839 } },
    ],
    items: [
      {
        update_timestamp: '2026-10-17T18:06:37+08:00',
        timestamp: '2026-10-17T17:58:00+08:00',
        valid_period: {
          start: '2026-10-17T17:30:00+08:00',
          end: '2026-10-17T19:30:00+08:00',
          text: '5.30 pm to 7.30 pm',
        },
        forecasts: [
          { area: 'Bedok', forecast: 'Cloudy' },
          { area: 'Bishan', forecast: 'Thundery Showers' },
        ],
      },
    ],
  },
};

// Trimmed copies of the live readings shapes. Two stations per feed so nearest-station selection is exercised.
const stationFeed = (readingType: string, unit: string, values: Array<[string, number]>) => ({
  code: 0,
  data: {
    stations: [
      { id: 'S109', name: 'Ang Mo Kio Avenue 5', location: { latitude: 1.3793, longitude: 103.85 } },
      { id: 'S50', name: 'Clementi Road', location: { latitude: 1.3337, longitude: 103.7768 } },
    ],
    readings: [
      {
        timestamp: '2026-10-17T18:02:00+08:00',
        data: values.map(([stationId, value]) => ({ stationId, value })),
      },
    ],
    readingType,
    readingUnit: unit,
  },
});

const uvFeed = {
  code: 0,
  data: {
    records: [
      {
        date: '2026-10-17',
        updatedTimestamp: '2026-10-17T17:11:02+08:00',
        timestamp: '2026-10-17T17:00:00+08:00',
        index: [{ hour: '2026-10-17T17:00:00+08:00', value: 1 }],
      },
    ],
  },
};

// Trimmed copies of the live psi and pm25 shapes. Region values are keyed by region name.
const regionMetadata = [
  { name: 'north', labelLocation: { latitude: 1.41803, longitude: 103.82 } },
  { name: 'south', labelLocation: { latitude: 1.29587, longitude: 103.82 } },
  { name: 'east', labelLocation: { latitude: 1.35735, longitude: 103.94 } },
  { name: 'west', labelLocation: { latitude: 1.35735, longitude: 103.7 } },
  { name: 'central', labelLocation: { latitude: 1.35735, longitude: 103.82 } },
];

const psiFeed = {
  code: 0,
  data: {
    regionMetadata,
    items: [
      {
        date: '2026-10-17',
        updatedTimestamp: '2026-10-17T18:00:38+08:00',
        timestamp: '2026-10-17T18:00:00+08:00',
        readings: {
          psi_twenty_four_hourly: { north: 129, south: 162, west: 196, east: 178, central: 186 },
        },
      },
    ],
  },
};

const pm25Feed = {
  code: 0,
  data: {
    regionMetadata,
    items: [
      {
        date: '2026-10-17',
        updatedTimestamp: '2026-10-17T18:00:38+08:00',
        timestamp: '2026-10-17T18:00:00+08:00',
        readings: {
          pm25_one_hourly: { north: 101, south: 188, west: 199, east: 159, central: 183 },
        },
      },
    ],
  },
};

// Trimmed copies of the live 24-hour and 4-day forecast shapes.
const twentyFourHourFeed = {
  code: 0,
  data: {
    records: [
      {
        date: '2026-10-17',
        timestamp: '2026-10-17T17:53:00+08:00',
        updatedTimestamp: '2026-10-17T18:01:32+08:00',
        general: {
          validPeriod: { text: '6 PM 17 Oct to 6 PM 18 Oct' },
          temperature: { high: 34, low: 25, unit: 'Degrees Celsius' },
          forecast: { code: 'HT', text: 'Heavy Thundery Showers' },
        },
        periods: [
          {
            timePeriod: { text: '6 pm 17 Oct to 6 am 18 Oct' },
            regions: {
              east: { code: 'HT', text: 'Heavy Thundery Showers' },
              west: { code: 'CL', text: 'Cloudy' },
              north: { code: 'CL', text: 'Cloudy' },
              south: { code: 'HT', text: 'Heavy Thundery Showers' },
              central: { code: 'HT', text: 'Heavy Thundery Showers' },
            },
          },
          {
            timePeriod: { text: '6 am 18 Oct to 12 pm 18 Oct' },
            regions: {
              east: { code: 'FA', text: 'Fair' },
              west: { code: 'FA', text: 'Fair' },
              north: { code: 'FA', text: 'Fair' },
              south: { code: 'FA', text: 'Fair' },
              central: { code: 'FA', text: 'Fair' },
            },
          },
        ],
      },
    ],
  },
};

const fourDayFeed = {
  items: [
    {
      update_timestamp: '2026-10-17T17:41:02+08:00',
      timestamp: '2026-10-17T17:34:00+08:00',
      forecasts: [
        {
          date: '2026-10-18',
          forecast: 'Afternoon thundery showers',
          temperature: { high: 34, low: 25 },
        },
        {
          date: '2026-10-19',
          forecast: 'Fair',
          temperature: { high: 33, low: 24 },
        },
      ],
    },
  ],
};

function fakeProvider(overrides: Record<string, unknown> = {}) {
  const feeds: Record<string, unknown> = {
    'two-hr-forecast': twoHourForecast,
    'air-temperature': stationFeed('DBT', 'deg C', [['S109', 29.5], ['S50', 27.1]]),
    'relative-humidity': stationFeed('RH', 'percentage', [['S109', 74.9], ['S50', 80]]),
    rainfall: stationFeed('TB1', 'mm', [['S109', 0], ['S50', 1.2]]),
    'wind-speed': stationFeed('Wind Speed', 'knots', [['S109', 2.7], ['S50', 4]]),
    'wind-direction': stationFeed('Wind Dir', 'degrees', [['S109', 216], ['S50', 90]]),
    uv: uvFeed,
    psi: psiFeed,
    pm25: pm25Feed,
    'twenty-four-hr-forecast': twentyFourHourFeed,
    '4-day-weather-forecast': fourDayFeed,
    ...overrides,
  };
  return vi.fn(async (url: string) => {
    const endpoint = url.includes('/v1/environment/')
      ? url.split('/v1/environment/')[1]
      : url.split('/v2/real-time/api/')[1];
    const body = feeds[endpoint];
    return body === null || body === undefined
      ? new Response('', { status: 404 })
      : new Response(JSON.stringify(body));
  });
}

describe('SingaporeWeatherClient current weather metrics', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fills every metric from the nearest station or UV record', async () => {
    vi.stubGlobal('fetch', fakeProvider());

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(snapshot).toMatchObject({
      condition: 'Thundery Showers',
      temperature_c: 29.5,
      humidity_percent: 74.9,
      rainfall_mm: 0,
      wind_speed_knots: 2.7,
      wind_direction_degrees: 216,
      uv_index: 1,
      psi_twenty_four_hourly: 186,
      pm25_one_hourly: 183,
      air_quality_region: 'central',
    });
  });

  it('maps the 24-hour and 4-day forecasts for the nearest region', async () => {
    vi.stubGlobal('fetch', fakeProvider());

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(snapshot.forecast_high_c).toBe(34);
    expect(snapshot.forecast_low_c).toBe(25);
    expect(snapshot.forecast_periods).toEqual([
      { label: '6 pm 17 Oct to 6 am 18 Oct', forecast: 'Heavy Thundery Showers' },
      { label: '6 am 18 Oct to 12 pm 18 Oct', forecast: 'Fair' },
    ]);
    expect(snapshot.daily_forecast).toEqual([
      {
        date: '2026-10-18',
        forecast: 'Afternoon thundery showers',
        temperature_low_c: 25,
        temperature_high_c: 34,
      },
      { date: '2026-10-19', forecast: 'Fair', temperature_low_c: 24, temperature_high_c: 33 },
    ]);
  });

  it('leaves forecasts empty when the forecast feeds fail', async () => {
    vi.stubGlobal(
      'fetch',
      fakeProvider({ 'twenty-four-hr-forecast': null, '4-day-weather-forecast': null }),
    );

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(snapshot.forecast_high_c).toBeNull();
    expect(snapshot.forecast_periods).toEqual([]);
    expect(snapshot.daily_forecast).toEqual([]);
    expect(snapshot.temperature_c).toBe(29.5);
  });

  it('leaves air quality null when the PSI feed fails', async () => {
    vi.stubGlobal('fetch', fakeProvider({ psi: null }));

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(snapshot.psi_twenty_four_hourly).toBeNull();
    expect(snapshot.pm25_one_hourly).toBeNull();
    expect(snapshot.air_quality_region).toBeNull();
    expect(snapshot.temperature_c).toBe(29.5);
  });

  it('leaves only the failing metric null', async () => {
    vi.stubGlobal('fetch', fakeProvider({ rainfall: null }));

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(snapshot.rainfall_mm).toBeNull();
    expect(snapshot.temperature_c).toBe(29.5);
    expect(snapshot.condition).toBe('Thundery Showers');
  });
});

describe('SingaporeWeatherClient two-hour forecast', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('maps the condition, area, and valid period for the nearest planning area', async () => {
    const fetchMock = vi.fn(async (_url: string) => new Response(JSON.stringify(twoHourForecast)));
    vi.stubGlobal('fetch', fetchMock);

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v2/real-time/api/two-hr-forecast'),
      expect.anything(),
    );
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api-open.data.gov.sg/v2/real-time/api/two-hr-forecast',
    );
    expect(snapshot).toMatchObject({
      condition: 'Thundery Showers',
      area: 'Bishan',
      observed_at: '2026-10-17T18:06:37+08:00',
      valid_period_text: '5.30 pm to 7.30 pm',
      source: 'api-open.data.gov.sg',
    });
  });

  it('returns an Unavailable condition when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));

    const snapshot = await new SingaporeWeatherClient().getCurrentWeather(1.35, 103.85);

    expect(snapshot.condition).toBe('Unavailable');
    expect(snapshot.valid_period_text).toBeNull();
  });
});
