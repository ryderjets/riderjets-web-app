import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const VEHICLE_TYPES = ["AUTO", "TROLLEY", "TATA_ACE", "SMALL_TRUCK", "LARGE_TRUCK", "OTHER"] as const;
const VETTING       = ["PENDING_REVIEW", "VETTED", "SUSPENDED"] as const;
const TRIP_STATUS   = ["COMPLETED", "IN_PROGRESS", "PENDING", "BLOCKED", "ISSUES", "OTHER"] as const;

const schema = a.schema({

  Trip: a
    .model({
      transactionDate:  a.date().required(),
      orderNumber:      a.string().required(),
      expense:          a.float(),
      status:           a.enum([...TRIP_STATUS]),
      notes:            a.string(),
      vendor:           a.string(),
      driverName:       a.string(),
      driverPhone:      a.string(),
      vehicleType:      a.enum([...VEHICLE_TYPES]),
      dateUpdated:      a.datetime(),
      // FK snapshots (hidden on UI)
      vehicleId:        a.string(),
      driverId:         a.string(),
      vehicleNumber:    a.string(),
      // PoD
      podUrl:           a.string(),
      podKind:          a.enum(["UPLOAD", "URL", "NONE"]),
      metadata:         a.json(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Driver: a
    .model({
      name:             a.string().required(),
      phone:            a.string().required(),
      vehicleType:      a.enum([...VEHICLE_TYPES]),
      preferredVendor:  a.string(),
      address:          a.string(),
      aadharNumber:     a.string(),
      aadharUrl:        a.string(),
      licenseNumber:    a.string(),
      licenseAttachmentUrl: a.string(),
      licenseExpiry:    a.date(),
      panNumber:        a.string(),
      panUrl:           a.string(),
      notes:            a.string(),
      vettingStatus:    a.enum([...VETTING]),
      isAvailable:      a.boolean().default(true),
      updatedDate:      a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

  Vehicle: a
    .model({
      vehicleNumber:    a.string().required(),
      type:             a.enum([...VEHICLE_TYPES]),
      driverName:       a.string(),
      driverPhone:      a.string(),
      make:             a.string(),
      model:            a.string(),
      capacityKg:       a.float(),
      truckSizeFt:      a.float(),
      rcNumber:         a.string(),
      rcUrl:            a.string(),
      insuranceNumber:  a.string(),
      insuranceExpiry:  a.date(),
      insuranceUrl:     a.string(),
      fitnessExpiry:    a.date(),
      ownerName:        a.string(),
      ownerPhone:       a.string(),
      ownerAddress:     a.string(),
      heightClearanceFt:a.float(),
      nationalPermit:   a.boolean(),
      nationalPermitNumber: a.string(),
      taxPermitUrl:     a.string(),
      vettingStatus:    a.enum([...VETTING]),
      updatedDate:      a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});
