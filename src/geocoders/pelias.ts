import * as L from 'leaflet';
import { getJSON } from '../util';
import { GeocoderAPI, GeocodingCallback, GeocodingResult } from './interfaces';

export interface PeliasOptions {
  serviceUrl: string;
  geocodingQueryParams?: Record<string, unknown>;
  reverseQueryParams?: Record<string, unknown>;
}

export class Pelias implements GeocoderAPI {
  options: PeliasOptions = {
    serviceUrl: 'https://api.geocode.earth/v1',
    geocodingQueryParams: {},
    reverseQueryParams: {}
  };

  private _lastSuggest = 0;

  constructor(private apiKey: string, options?: Partial<PeliasOptions>) {
    L.Util.setOptions(this, options);
  }

  geocode(query: string, cb: GeocodingCallback, context?: any): void {
    getJSON(
      this.options.serviceUrl + '/search',
      L.Util.extend(
        {
          api_key: this.apiKey,
          text: query
        },
        this.options.geocodingQueryParams
      ),
      data => {
        cb.call(context, this._parseResults(data, 'bbox'));
      }
    );
  }

  suggest(query: string, cb: GeocodingCallback, context?: any): void {
    getJSON(
      this.options.serviceUrl + '/autocomplete',
      L.Util.extend(
        {
          api_key: this.apiKey,
          text: query
        },
        this.options.geocodingQueryParams
      ),
      data => {
        if (data.geocoding.timestamp > this._lastSuggest) {
          this._lastSuggest = data.geocoding.timestamp;
          cb.call(context, this._parseResults(data, 'bbox'));
        }
      }
    );
  }

  reverse(
    location: L.LatLngLiteral,
    scale: number,
    cb: (result: any) => void,
    context?: any
  ): void {
    getJSON(
      this.options.serviceUrl + '/reverse',
      L.Util.extend(
        {
          api_key: this.apiKey,
          'point.lat': location.lat,
          'point.lon': location.lng
        },
        this.options.reverseQueryParams
      ),
      data => {
        cb.call(context, this._parseResults(data, 'bounds'));
      }
    );
  }

  _parseResults(data, bboxname) {
    const results: GeocodingResult[] = [];
    L.geoJSON(data, {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng);
      },
      onEachFeature: function(feature, layer: any) {
        const result = {} as GeocodingResult;
        let bbox;
        let center;

        if (layer.getBounds) {
          bbox = layer.getBounds();
          center = bbox.getCenter();
        } else if (layer.feature.bbox) {
          center = layer.getLatLng();
          bbox = L.latLngBounds(
            L.GeoJSON.coordsToLatLng(layer.feature.bbox.slice(0, 2)),
            L.GeoJSON.coordsToLatLng(layer.feature.bbox.slice(2, 4))
          );
        } else {
          center = layer.getLatLng();
          bbox = L.latLngBounds(center, center);
        }

        result.name = layer.feature.properties.label;
        result.center = center;
        result[bboxname] = bbox;
        result.properties = layer.feature.properties;
        results.push(result);
      }
    });
    return results;
  }
}

export function pelias(apiKey: string, options?: Partial<PeliasOptions>) {
  return new Pelias(apiKey, options);
}
export const GeocodeEarth = Pelias;
export const geocodeEarth = pelias;

export const Mapzen = Pelias; // r.i.p.
export const mapzen = pelias;

export class Openrouteservice extends Mapzen {
  constructor(apiKey: string, options?: Partial<PeliasOptions>) {
    super(
      apiKey,
      L.Util.extend(
        {
          serviceUrl: 'https://api.openrouteservice.org/geocode'
        },
        options
      )
    );
  }
}
export function openrouteservice(apiKey: string, options?: Partial<PeliasOptions>) {
  return new Openrouteservice(apiKey, options);
}
