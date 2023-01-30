import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      return await fastify.db.users
        .findOne({ key: 'id', equals: id })
        .then((user) => {
          if (user === null) throw fastify.httpErrors.notFound();

          return user;
        });
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const newUserDTO = request.body;
      const newUser = await fastify.db.users.create(newUserDTO);

      return newUser;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      await fastify.db.users.findOne({ key: 'id', equals: id }).then((user) => {
        if (user === null) throw fastify.httpErrors.badRequest();

        return user;
      });

      const deletedUser = await fastify.db.users.delete(id);

      const usersHasId = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: id,
      });

      const usersProfileHasId = await fastify.db.profiles
        .findOne({
          key: 'userId',
          equals: id,
        })
        .then((profile) => {
          if (profile === null) throw fastify.httpErrors.notFound();
          return profile;
        });

      await fastify.db.profiles.delete(usersProfileHasId.id);

      usersHasId.forEach((user) => {
        user.subscribedToUserIds = user.subscribedToUserIds.filter(
          (itemId) => itemId !== id
        );
        fastify.db.users.change(user.id, user);
      });

      return deletedUser;
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const currentUserId = request.params.id;
      const subscribeToUserId = request.body.userId;

      await fastify.db.users
        .findOne({
          key: 'id',
          equals: currentUserId,
        })
        .then((user) => {
          if (user === null) throw fastify.httpErrors.badRequest();

          return user;
        });

      const subscribeToUser = await fastify.db.users
        .findOne({
          key: 'id',
          equals: subscribeToUserId,
        })
        .then((user) => {
          if (user === null) throw fastify.httpErrors.notFound();

          if (user.subscribedToUserIds.includes(currentUserId))
            throw fastify.httpErrors.badRequest();

          user.subscribedToUserIds.push(currentUserId);

          return user;
        });

      return fastify.db.users.change(subscribeToUserId, subscribeToUser);
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const currentUserId = request.params.id;
      const unsubscribeFromId = request.body.userId;

      await fastify.db.users
        .findOne({
          key: 'id',
          equals: currentUserId,
        })
        .then((user) => {
          if (user === null) throw fastify.httpErrors.badRequest();

          return user;
        });

      const unsubscribeFromUser = await fastify.db.users
        .findOne({
          key: 'id',
          equals: unsubscribeFromId,
        })
        .then((user) => {
          if (user === null) throw fastify.httpErrors.badRequest();
          const idx = user.subscribedToUserIds.findIndex(
            (id) => id === currentUserId
          );

          if (idx === -1) throw fastify.httpErrors.badRequest();

          user.subscribedToUserIds.splice(idx, 1);

          return user;
        });

      return fastify.db.users.change(unsubscribeFromId, unsubscribeFromUser);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      await fastify.db.users
        .findOne({
          key: 'id',
          equals: id,
        })
        .then((user) => {
          if (user === null) throw fastify.httpErrors.badRequest();

          return user;
        });
      const updatedUser = { ...request.body };

      return await fastify.db.users.change(id, updatedUser);
    }
  );
};

export default plugin;
