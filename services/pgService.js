const PG = require('../models/PG');
const AppError = require('../utils/AppError');

const create = async (data, userId) => {
  return PG.create({ ...data, postedBy: userId });
};

const getAll = async (query) => {
  const {
    city,
    location,
    minRent,
    maxRent,
    gender,
    sharing,
    meals,
    mealType,
    sort,
    page = 1,
    limit = 10,
  } = query;

  const filter = { isHidden: { $ne: true } };
  if (city) filter.city = new RegExp(city, 'i');
  if (location) filter.location = new RegExp(location, 'i');
  if (gender) filter.gender = gender;
  if (sharing) filter.sharing = sharing;
  if (meals !== undefined) filter.meals = meals === 'true';
  if (mealType) filter.mealType = mealType;
  if (minRent || maxRent) {
    filter.rent = {};
    if (minRent) filter.rent.$gte = Number(minRent);
    if (maxRent) filter.rent.$lte = Number(maxRent);
  }

  const skip = (Number(page) - 1) * Number(limit);

  let sortObj = { createdAt: -1 };
  if (sort === 'rent') sortObj = { rent: 1 };
  else if (sort === '-rent') sortObj = { rent: -1 };

  const [pgs, total] = await Promise.all([
    PG.find(filter)
      .populate('postedBy', 'name email verified profileImage')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit)),
    PG.countDocuments(filter),
  ]);

  return {
    pgs,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
  };
};

const getById = async (id) => {
  const pg = await PG.findById(id).populate('postedBy', 'name email verified profileImage phone');
  if (!pg) throw new AppError('PG not found', 404);
  return pg;
};

const update = async (id, data, userId) => {
  const pg = await PG.findById(id);
  if (!pg) throw new AppError('PG not found', 404);
  if (pg.postedBy.toString() !== userId) throw new AppError('Not authorized', 403);
  Object.assign(pg, data);
  await pg.save();
  return pg;
};

const remove = async (id, userId) => {
  const pg = await PG.findById(id);
  if (!pg) throw new AppError('PG not found', 404);
  if (pg.postedBy.toString() !== userId) throw new AppError('Not authorized', 403);
  await pg.deleteOne();
};

module.exports = { create, getAll, getById, update, remove };
