import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return await fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      return await fastify.db.posts
        .findOne({ key: 'id', equals: id })
        .then((post) => {
          if (post === null) throw fastify.httpErrors.notFound();

          return post;
        });
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const newPostDTO = request.body;
      const newPost = await fastify.db.posts.create(newPostDTO);

      return newPost;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      await fastify.db.posts.findOne({ key: 'id', equals: id }).then((post) => {
        if (post === null) throw fastify.httpErrors.badRequest();

        return post;
      });

      return await fastify.db.posts.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;
      await fastify.db.posts
        .findOne({
          key: 'id',
          equals: id,
        })
        .then((post) => {
          if (post === null) throw fastify.httpErrors.badRequest();

          return post;
        });
      const updatedPost = { ...request.body };

      return await fastify.db.posts.change(id, updatedPost);
    }
  );
};

export default plugin;
