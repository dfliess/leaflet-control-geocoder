import * as L from 'leaflet';
import { getJSON } from '../util';
import { GeocoderAPI, GeocodingCallback, GeocodingResult } from './interfaces';

export class What3Words implements GeocoderAPI {
  options = {
    serviceUrl: 'https://api.what3words.com/v2/'
  };

  constructor(private accessToken: string) {}

  geocode(query: string, cb: GeocodingCallback, context?: any): void {
    //get three words and make a dot based string
    getJSON(
      this.options.serviceUrl + 'forward',
      {
        key: this.accessToken,
        addr: query.split(/\s+/).join('.')
      },
      data => {
        const results: GeocodingResult[] = [];
        if (data.geometry) {
          const latLng = L.latLng(data.geometry['lat'], data.geometry['lng']);
          const latLngBounds = L.latLngBounds(latLng, latLng);
          results[0] = {
            name: data.words,
            bbox: latLngBounds,
            center: latLng
          };
        }

        cb.call(context, results);
      }
    );
  }

  suggest(query: string, cb: GeocodingCallback, context?: any): void {
    return this.geocode(query, cb, context);
  }

  reverse(
    location: L.LatLngLiteral,
    scale: number,
    cb: (result: any) => void,
    context?: any
  ): void {
    getJSON(
      this.options.serviceUrl + 'reverse',
      {
        key: this.accessToken,
        coords: [location.lat, location.lng].join(',')
      },
      data => {
        const results: GeocodingResult[] = [];
        if (data.status.status == 200) {
          const center = L.latLng(data.geometry['lat'], data.geometry['lng']);
          const bbox = L.latLngBounds(center, center);
          results[0] = {
            name: data.words,
            bbox: bbox,
            center: center
          };
        }
        cb.call(context, results);
      }
    );
  }
}

export function what3words(accessToken: string) {
  return new What3Words(accessToken);
}
