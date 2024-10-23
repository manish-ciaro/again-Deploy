import { sanitizeUrl } from "@braintree/sanitize-url";

interface JsonObject {
  [key: string]: any;
  [Symbol.iterator](): IterableIterator<any>;
}

interface Item {
  _id: string;
  nameId: string;
  name: string;
  group: string;
  policies: any[];
  projects: any[];
  risks: any[];
  tags: any[];
  procedures: any[];
  __v: number;
}


export default function isEmpty(...args:any[]){
    return !args.every((arg) => {
        switch(typeof(arg)){
            case "number": return true;
            case "string": arg.trim();break
            case "object": return Boolean(Object.keys(arg).length);
            default: return false
        }
        return Boolean(arg)
    })
}

export const isAValidUrl = (s:string, protocols=["http","https"]) => {
  try {
    const parsed = new URL(sanitizeUrl(s));
    return protocols
        ? parsed.protocol
            ? protocols.map(x => `${x.toLowerCase()}:`).includes(parsed.protocol)
            : false
        : true;
  } catch (err) {
      return false;
  }
};


export function flattenDictionary(dictionary: Record<string, any>, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
  
    for (const key in dictionary) {
      if (dictionary.hasOwnProperty(key)) {
        const value = dictionary[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
  
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const nestedObj = flattenDictionary(value, newKey);
          Object.assign(result, nestedObj);
        } else {
          result[newKey] = value;
        }
      }
    }
  
    return result;
  }

export function getDateAfterDays(numDays:number):Date {
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + numDays);
  return currentDate;
}

export function generateRandomNumber(length = 6) {
  const min = Math.pow(10, length - 1); // Minimum number based on length
  const max = Math.pow(10, length) - 1; // Maximum number based on length
  return (Math.floor(Math.random() * (max - min + 1)) + min).toString();
}

export function createNestedJsonWithSubDocs(arr: Item[]): Record<string, any> {
  const nestedJson: Record<string, any> = {};

  for (const item of arr) {
    const parts = item.nameId.split('.');
    let currentObj: Record<string, any> = nestedJson;

    for (const part of parts) {
      if (!currentObj[part]) {
        currentObj[part] = {};
      }
      currentObj = currentObj[part];
    }

    currentObj._id = item._id;
    currentObj.name = item.name;
    currentObj.policies = item.policies;
    currentObj.projects = item.projects;
    currentObj.risks = item.risks;
    currentObj.tags = item.tags;
    currentObj.procedures = item.procedures;
    currentObj.__v = item.__v;
  }

  return nestedJson;
}

  