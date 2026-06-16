const { expect } = require('chai');
const CreatorCardRepository = require('@app/repository/creator-card');
const createCreatorCard = require('@app/services/creator-cards/create');
const getCreatorCard = require('@app/services/creator-cards/get');
const deleteCreatorCard = require('@app/services/creator-cards/delete');

describe('creator cards', () => {
  const store = new Map();
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
  });

  it('creates and retrieves a published public card', async () => {
    const created = await createCreatorCard({
      title: 'George Cooks',
      description: 'Weekly cooking podcast',
      slug: 'george-cooks',
      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
      links: [{ title: 'YouTube', url: 'https://youtube.com/@georgecooks' }],
      service_rates: {
        currency: 'NGN',
        rates: [{ name: 'IG Story Post', description: 'One story mention', amount: 5000000 }],
      },
      status: 'published',
    });

    expect(created).to.include({
      title: 'George Cooks',
      slug: 'george-cooks',
      access_type: 'public',
      access_code: null,
    });
    expect(created).to.have.property('id');
    expect(created).not.to.have.property('_id');

    const retrieved = await getCreatorCard({ slug: 'george-cooks' });

    expect(retrieved.id).to.equal(created.id);
    expect(retrieved).not.to.have.property('access_code');
  });

  it('auto-generates slugs and deletes cards', async () => {
    const created = await createCreatorCard({
      title: 'Ada Designs Things',
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
      status: 'published',
    });

    expect(created.slug).to.equal('ada-designs-things');

    const deleted = await deleteCreatorCard({
      slug: created.slug,
      creator_reference: 'crt_a1b2c3d4e5f6g7h8',
    });

    expect(deleted.deleted).to.be.a('number');

    try {
      await getCreatorCard({ slug: created.slug });
      throw new Error('deleted card should not be retrievable');
    } catch (error) {
      expect(error.errorCode).to.equal('NF01');
    }
  });

  it('requires creator_reference to match when deleting a card', async () => {
    const created = await createCreatorCard({
      title: 'Owner Checked Card',
      creator_reference: 'crt_o1w2n3e4r5c6h7k8',
      status: 'published',
    });

    try {
      await deleteCreatorCard({
        slug: created.slug,
        creator_reference: 'crt_w1r2o3n4g5o6w7n8',
      });
      throw new Error('wrong creator reference should not delete card');
    } catch (error) {
      expect(error.errorCode).to.equal('NF01');
    }

    const retrieved = await getCreatorCard({ slug: created.slug });
    expect(retrieved.id).to.equal(created.id);
  });

  it('keeps auto-generated slugs within the entity length limit', async () => {
    const created = await createCreatorCard({
      title: 'This Creator Title Is Deliberately Very Long And Should Still Produce A Valid Slug',
      creator_reference: 'crt_l1o2n3g4s5l6u7g8',
      status: 'published',
    });

    expect(created.slug.length).to.be.at.most(50);
    expect(created.slug).to.match(/^[a-z0-9_-]+$/);
  });

  it('maps Mongo duplicate slug races to assessment-safe behavior', async () => {
    const originalCreate = CreatorCardRepository.create;
    let shouldThrowDuplicate = true;

    CreatorCardRepository.create = async (data) => {
      if (shouldThrowDuplicate) {
        shouldThrowDuplicate = false;
        const error = new Error('An existing slug record exists.');
        error.isApplicationError = true;
        error.errorCode = 'DUPLICATE_RECORD';
        throw error;
      }

      return originalCreate(data);
    };

    try {
      await createCreatorCard({
        title: 'Race Condition',
        slug: 'race-condition',
        creator_reference: 'crt_r1a2c3e4s5l6u7g8',
        status: 'published',
      });
      throw new Error('client supplied duplicate slug should fail');
    } catch (error) {
      expect(error.errorCode).to.equal('SL02');
    }

    shouldThrowDuplicate = true;

    const created = await createCreatorCard({
      title: 'Auto Race Condition',
      creator_reference: 'crt_a1u2t3o4r5a6c7e8',
      status: 'published',
    });

    expect(created.slug).to.match(/^auto-race-condition-[a-z0-9]{6}$/);
  });

  it('enforces private card access rules', async () => {
    const created = await createCreatorCard({
      title: 'VIP Rate Card',
      creator_reference: 'crt_x9y8z7w6v5u4t3s2',
      status: 'published',
      access_type: 'private',
      access_code: 'A1B2C3',
    });

    expect(created.access_code).to.equal('A1B2C3');

    try {
      await getCreatorCard({ slug: created.slug });
      throw new Error('private card should require an access code');
    } catch (error) {
      expect(error.errorCode).to.equal('AC03');
    }

    try {
      await getCreatorCard({ slug: created.slug, access_code: 'WRONG1' });
      throw new Error('private card should reject a wrong access code');
    } catch (error) {
      expect(error.errorCode).to.equal('AC04');
    }

    const retrieved = await getCreatorCard({ slug: created.slug, access_code: 'A1B2C3' });

    expect(retrieved.id).to.equal(created.id);
    expect(retrieved).not.to.have.property('access_code');
  });

  it('returns required custom business error codes', async () => {
    await createCreatorCard({
      title: 'George Cooks',
      slug: 'george-cooks',
      creator_reference: 'crt_8f2k1m9x4p7w3q5z',
      status: 'published',
    });

    const cases = [
      createCreatorCard({
        title: 'Another George',
        slug: 'george-cooks',
        creator_reference: 'crt_m1n2b3v4c5x6z7l8',
        status: 'published',
      }),
      createCreatorCard({
        title: 'Secret Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'private',
      }),
      createCreatorCard({
        title: 'Public Card',
        creator_reference: 'crt_q1w2e3r4t5y6u7i8',
        status: 'published',
        access_type: 'public',
        access_code: 'A1B2C3',
      }),
      getCreatorCard({ slug: 'does-not-exist-123' }),
    ];
    const expectedCodes = ['SL02', 'AC01', 'AC05', 'NF01'];

    const results = await Promise.all(
      cases.map((casePromise) => casePromise.catch((error) => error.errorCode))
    );

    expect(results).to.deep.equal(expectedCodes);
  });
});
