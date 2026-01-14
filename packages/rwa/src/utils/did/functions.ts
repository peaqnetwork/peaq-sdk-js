import { document as DID } from '../did/did_document_format';
import { genDidId, genPeaqId } from '../nft';

export async function setupDidDocument(
    mnftIssuer: string,
    machineNft: string,
    index: number = 0
  ): Promise<DID.Document> {
  
    const doc = new DID.Document();
  
    doc.verifiable_credential = new DID.VerifiableCredential();
    doc.verifiable_credential.credential_subject =
      setupDidCredentialSubject(index);
  
    doc.verifiable_credential.id = machineNft;
    doc.verifiable_credential.type = 'MachineNft';
    doc.verifiable_credential.issuer = mnftIssuer;
    doc.verifiable_credential.issuance_date = new Date().toISOString();
  
    doc.services = [
      setupDidService(
        '#p2p',
        'p2p',
        '/ipv4/w.x.y.z/tcp/port/p2p-circuit/p2p/QmPublicKey'
      ),
      setupDidService(
        '#metadata',
        'metadata',
        '/ipv4/w.x.y.z/tcp/port/p2p-circuit/p2p/QmPublicKey'
      )
    ];
  
    doc.id = await genDidId(doc);
  
    return doc;
  }

  function setupDidService(
    id: string,
    type: string,
    serviceEndpoint: string
  ): DID.Service {
    let service = new DID.Service();
    service.id = id;
    service.type = type;
    service.service_endpoint = serviceEndpoint;
    return service;
  }

  function setupDidCredentialSubject(index: number): DID.CredentialSubject {
    let machineSubject = new DID.MachineSubject();
    let credentialSubject = new DID.CredentialSubject();
  
    machineSubject.type = 'Vehicle';
    machineSubject.manufacturer = 'BMW';
    machineSubject.model = 'X3';
    machineSubject.edition = '2023';
    machineSubject.color = 'Black';
    machineSubject.day_of_manufacture = '2024-01-15';
    machineSubject.country = 'Germany';
    machineSubject.city = 'Munich';
    machineSubject.serial_number = `WBAKS51060DG12345${index}`;
  
    credentialSubject.type = DID.SubjectType.MACHINE;
    credentialSubject.machine = machineSubject;
  
    return credentialSubject;
  }