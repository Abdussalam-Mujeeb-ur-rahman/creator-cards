const { expect } = require('chai');
const createMockServer = require('@app-core/mock-server');
const CreatorCardRepository = require('@app/repository/creator-card');

describe('creator card endpoints', () => {
  const store = new Map();
  let server;
  let counter = 0;

  beforeEach(() => {
    store.clear();
    counter = 0;

    CreatorCardRepository.findOne = async ({ query }) => {
      const cards = Array.from(store.values());

      return (
        cards.find((card) => Object.entries(query).every(([key, value]) => card[key] === value)) ||
        null
      );
    };

    CreatorCardRepository.create = async (data) => {
      const now = 1767052800000 + counter;
      const card = {
        _id: `01JG8XYZA2B3C4D5E6F7G8H9J${counter}`,
        ...data,
        created: now,
        updated: now,
      };

      counter += 1;
      store.set(card.slug, card);

      return card;
    };

    CreatorCardRepository.updateOne = async ({ query, updateValues }) => {
      const card = await CreatorCardRepository.findOne({ query });

      Object.assign(card, updateValues, { updated: updateValues.updated || Date.now() });

      return { acknowledged: true, modifiedCount: 1 };
    };

    server = createMockServer(['endpoints/creator-cards']);
  });

  it('returns the expected HTTP envelope for public card creation and retrieval', async () => {
    const creationResponse = await server.post('/creator-cards', {
      body: {
        title: 'George Cooks',
        slug: 'george-cooks',
        creator_reference: 'crt_8f2k1m9x4p7w3q5z',
        status: 'published',
      },
    });

    expect(creationResponse.statusCode).to.equal(200);
    expect(creationResponse.data).to.include({
      status: 'success',
      message: 'Creator Card Created Successfully.',
    });
    expect(creationResponse.data.data).to.include({
      slug: 'george-cooks',
      access_type: 'public',
      access_code: null,
    });
    expect(creationResponse.data.data).to.have.property('id');
    expect(creationResponse.data.data).not.to.have.property('_id');

    const retrievalResponse = await server.get('/creator-cards/george-cooks');

    expect(retrievalResponse.statusCode).to.equal(200);
    expect(retrievalResponse.data).to.include({
      status: 'success',
      message: 'Creator Card Retrieved Successfully.',
    });
    expect(retrievalResponse.data.data).not.to.have.property('access_code');
  });

  it('returns required HTTP codes and custom error codes', async () => {
    await server.post('/creator-cards', {
      body: {
        title: 'VIP Rate Card',
        creator_reference: 'crt_x9y8z7w6v5u4t3s2',
        status: 'published',
        access_type: 'private',
        access_code: 'A1B2C3',
      },
    });

    const noPinResponse = await server.get('/creator-cards/vip-rate-card');
    expect(noPinResponse.statusCode).to.equal(403);
    expect(noPinResponse.data).to.include({ status: 'error', code: 'AC03' });

    const wrongPinResponse = await server.get('/creator-cards/vip-rate-card?access_code=WRONG1');
    expect(wrongPinResponse.statusCode).to.equal(403);
    expect(wrongPinResponse.data).to.include({ status: 'error', code: 'AC04' });

    const notFoundResponse = await server.get('/creator-cards/does-not-exist-123');
    expect(notFoundResponse.statusCode).to.equal(404);
    expect(notFoundResponse.data).to.include({ status: 'error', code: 'NF01' });
  });
});
