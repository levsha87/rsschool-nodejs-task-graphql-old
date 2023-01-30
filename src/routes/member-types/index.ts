import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    MemberTypeEntity[]
  > {
    return await fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id } = request.params;
      return await fastify.db.memberTypes
        .findOne({ key: 'id', equals: id })
        .then((memberType) => {
          if (memberType === null) throw fastify.httpErrors.notFound();

          return memberType;
        });
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id } = request.params;
      await fastify.db.memberTypes
        .findOne({
          key: 'id',
          equals: id,
        })
        .then((memberType) => {
          if (memberType === null) throw fastify.httpErrors.badRequest();

          return memberType;
        });
      const updatedMemeberType = { ...request.body };

      return await fastify.db.memberTypes.change(id, updatedMemeberType);
    }
  );
};

export default plugin;
