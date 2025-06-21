import request from "supertest";
import { app } from "../../app";
import { db } from "../../db";
import { user } from "../../db/schemas/user.schema";
import { createUser } from "../lib";
import { expect, describe, it, afterEach, beforeAll, afterAll } from "bun:test";
import { role } from "../../db/schemas/role.schema";
import { redisClient } from "../../utils/redis.utils";
import {
  basePropertyDTO,
  basePropertyMediaDTO,
  CreatePropertyInputDTO,
} from "../../dtos/property.dto";
import { z } from "zod";
import { property } from "../../db/schemas/property.schema";
import L from "../../i18n/i18n-node";

const basicUser = {
  email: "johndoe@example.com",
  firstName: "John",
  lastName: "Doe",
  password: "password",
  confirmPassword: "password",
  role: "AGENT",
};

const tinyPngBuffer = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

const locale = "en";

describe("Check for properties endpoints inputs and outputs ", () => {
  it("POST /api/properties creates and returns a property", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });
  });

  it("GET /api/properties returns an array of properties", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")

      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const getPropertiesResponse = await request(app)
      .get("/api/properties")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(getPropertiesResponse.body).toMatchObject({
      message: L[locale].PROPERTIES_RETRIEVED_SUCCESSFULLY(),
      data: [createdPropertyData],
    });
  });

  it("GET /api/properties/:id returns a property", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")

      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const getPropertyResponse = await request(app)
      .get("/api/properties/" + createPropertyResponse.body.data.id)
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(getPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_RETRIEVED_SUCCESSFULLY(),
      data: createdPropertyData,
    });
  });

  it("DELETE /api/properties/:id deletes a property", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")

      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const deletePropertyResponse = await request(app)
      .delete("/api/properties/" + createPropertyResponse.body.data.id)
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(deletePropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_DELETED_SUCCESSFULLY(),
      data: createdPropertyData,
    });
  });

  it("PATCH /api/properties/:id updates a property", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")

      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const updatePropertyInput: CreatePropertyInputDTO = {
      title: "updated property",
      description: "updated description",
      price: "1599.99",
      area: 50,
      rooms: 1,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const updatedPropertyData = {
      ...updatePropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    const updatePropertyResponse = await request(app)
      .patch("/api/properties/" + createPropertyResponse.body.data.id)
      .send(updatePropertyInput)
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(updatePropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_UPDATED_SUCCESSFULLY(),
      data: updatedPropertyData,
    });
  });

  it("POST /api/properties/:id/media creates and returns a media", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const createMediaResponse = await request(app)
      .post(`/api/properties/${createPropertyResponse.body.data.id}/media`)
      .attach("media", tinyPngBuffer, "thumbnail.png")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdMediaData: z.infer<typeof basePropertyMediaDTO> = {
      id: expect.any(Number),
      propertyId: createPropertyResponse.body.data.id,
      type: "IMAGE",
      mimeType: "image/png",
      url: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createMediaResponse.body).toMatchObject({
      message: L[locale].PROPERTY_MEDIA_CREATED_SUCCESSFULLY(),
      data: [createdMediaData],
    });
  });

  it("GET /api/properties/:id/media returns all media", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createPropertyInput.title)
      .field("description", createPropertyInput.description)
      .field("price", createPropertyInput.price)
      .field("area", createPropertyInput.area)
      .field("rooms", createPropertyInput.rooms)
      .field("type", createPropertyInput.type)
      .field("status", createPropertyInput.status)
      .field("isPublished", createPropertyInput.isPublished)
      .field("location", JSON.stringify(createPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")

      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const createMediaResponse = await request(app)
      .post(`/api/properties/${createPropertyResponse.body.data.id}/media`)
      .attach("media", tinyPngBuffer, "thumbnail.png")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdMediaData: z.infer<typeof basePropertyMediaDTO> = {
      id: expect.any(Number),
      propertyId: createPropertyResponse.body.data.id,
      type: "IMAGE",
      mimeType: "image/png",
      url: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createMediaResponse.body).toMatchObject({
      message: L[locale].PROPERTY_MEDIA_CREATED_SUCCESSFULLY(),
      data: [createdMediaData],
    });

    const getMediaResponse = await request(app)
      .get(`/api/properties/${createPropertyResponse.body.data.id}/media`)
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(getMediaResponse.body).toMatchObject({
      message: L[locale].PROPERTY_MEDIA_RETRIEVED_SUCCESSFULLY(),
      data: [createdMediaData],
    });
  });

  it("DELETE /api/properties/:id/media/mediaId deletes a media", async () => {
    await createUser(basicUser);
    const userLoginInput = {
      email: basicUser.email,
      password: basicUser.password,
    };
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send(userLoginInput)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    const createdPropertyInput: CreatePropertyInputDTO = {
      title: "test property",
      description: "test description",
      price: "1000",
      area: 100,
      rooms: 3,
      type: "APARTMENT",
      status: "AVAILABLE",
      isPublished: true,
      location: { x: 0, y: 0 },
    };

    const createPropertyResponse = await request(app)
      .post("/api/properties")
      .field("title", createdPropertyInput.title)
      .field("description", createdPropertyInput.description)
      .field("price", createdPropertyInput.price)
      .field("area", createdPropertyInput.area)
      .field("rooms", createdPropertyInput.rooms)
      .field("type", createdPropertyInput.type)
      .field("status", createdPropertyInput.status)
      .field("isPublished", createdPropertyInput.isPublished)
      .field("location", JSON.stringify(createdPropertyInput.location))
      .attach("thumbnail", tinyPngBuffer, "thumbnail.png")

      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdPropertyData: z.infer<typeof basePropertyDTO> = {
      ...createdPropertyInput,
      userId: expect.any(String),
      thumbnailURL: expect.any(String),
      isFeatured: false,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createPropertyResponse.body).toMatchObject({
      message: L[locale].PROPERTY_CREATED_SUCCESSFULLY(),
      data: createdPropertyData,
    });

    const createMediaResponse = await request(app)
      .post(`/api/properties/${createPropertyResponse.body.data.id}/media`)
      .attach("media", tinyPngBuffer, "thumbnail.png")
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "multipart/form-data")
      .expect("Content-Type", /json/)
      .expect(201);

    const createdMediaData: z.infer<typeof basePropertyMediaDTO> = {
      propertyId: createPropertyResponse.body.data.id,
      type: "IMAGE",
      mimeType: "image/png",
      url: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    };

    expect(createMediaResponse.body).toMatchObject({
      message: L[locale].PROPERTY_MEDIA_CREATED_SUCCESSFULLY(),
      data: [createdMediaData],
    });

    const deleteMediaResponse = await request(app)
      .delete(
        `/api/properties/${createPropertyResponse.body.data.id}/media/${createMediaResponse.body.data[0].id}`,
      )
      .set("Authorization", `Bearer ${loginResponse.body.data.accessToken}`)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(deleteMediaResponse.body).toMatchObject({
      message: L[locale].PROPERTY_MEDIA_DELETED_SUCCESSFULLY(),
      data: [createdMediaData],
    });
  });
});

beforeAll(async () => {
  await db.insert(role).values([
    {
      name: "ADMIN",
    },
    {
      name: "AGENT",
    },
    {
      name: "CLIENT",
    },
  ]);

  try {
    await redisClient.connect();
  } catch (error) {
    console.error(error);
  }
});

afterAll(async () => {
  await db.delete(role).execute();
  await db.delete(property).execute();
});

afterEach(async () => {
  await db.delete(user).execute();
});
