import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;
      return await fastify.db.profiles
        .findOne({ key: 'id', equals: id })
        .then((profile) => {
          if (profile === null) throw fastify.httpErrors.notFound();

          return profile;
        });
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const newUserProfileDTO = request.body;
      const { memberTypeId } = request.body;
      const userId = request.body.userId;
      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: userId,
      });

      if (profile) throw fastify.httpErrors.badRequest();
      const realUser = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      if (realUser === null) throw fastify.httpErrors.badRequest();

      if (memberTypeId !== ('basic' || 'business'))
        throw fastify.httpErrors.badRequest();

      const newUserProfile = await fastify.db.profiles.create(
        newUserProfileDTO
      );

      return newUserProfile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const id = request.params.id;
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

      if (profile === null) throw fastify.httpErrors.badRequest();

      const realUser = await fastify.db.users.findOne({
        key: 'id',
        equals: profile.userId,
      });

      if (realUser === null) throw fastify.httpErrors.badRequest();

      return await fastify.db.profiles.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

      if (profile === null) throw fastify.httpErrors.badRequest();

      const realUser = await fastify.db.users.findOne({
        key: 'id',
        equals: profile.userId,
      });

      if (realUser === null) throw fastify.httpErrors.badRequest();

      return await fastify.db.profiles.change(id, request.body);
    }
  );
};

export default plugin;
