declare module "google-protobuf" {
    // Allow `import * as pb_1 from "google-protobuf"`
    // and then use `pb_1.BinaryReader` / `pb_1.BinaryWriter` as types.
    export class BinaryReader {
      constructor(bytes?: Uint8Array | ArrayBuffer | number[]);
      [key: string]: any;
    }
  
    export class BinaryWriter {
      constructor();
      getResultBuffer(): Uint8Array;
      [key: string]: any;
    }
  
    export class Message {
      // Generated jspb code calls a bunch of static helpers; keep them loose.
      static initialize(...args: any[]): void;
      static getField(...args: any[]): any;
      static getFieldWithDefault(...args: any[]): any;
      static setField(...args: any[]): void;
      static setOneofField(...args: any[]): void;
      static computeOneofCase(...args: any[]): any;
  
      static getWrapperField(...args: any[]): any;
      static setWrapperField(...args: any[]): void;
  
      static getRepeatedWrapperField(...args: any[]): any;
      static setRepeatedWrapperField(...args: any[]): void;
  
      static setOneofWrapperField(...args: any[]): void;
      static addToRepeatedWrapperField(...args: any[]): any;
      static addToRepeatedField(...args: any[]): any;
  
      static serializeBinaryToWriter(...args: any[]): void;
      static deserializeBinaryFromReader(...args: any[]): any;
  
      [key: string]: any;
    }
  
    // Some generators also reference these namespaces/types
    export namespace BinaryConstants {
      // leave open
      const [key: string]: any;
    }
  
    // Default export to satisfy other import styles
    const _default: any;
    export default _default;
  }
  