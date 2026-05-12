import express from 'express';
import { submitCart,
  getAllCarts,
  getCartById,
  approveCart,
  rejectCart,
  markPaymentDone,
  confirmDelivery,
  deleteCart,getDeliveryChecklist,  fetchAlias,addAlias,createInward } from '../controllers/cart.controller.js';
import { authed } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = express.Router();

router.post('/submit', submitCart);

router.get(
  '/',
//  auth,
  getAllCarts
);
router.get(
  '/alias',
  fetchAlias
);

router.post(
  '/addalias',
  addAlias
);
router.post(
  '/inward',
  createInward
);

router.get(
  '/:id',
  //auth,
  getCartById
);

router.patch(
  '/:id/approve',
// auth,
//  requireRole('lead'),
  approveCart
);

router.patch(
  '/:id/reject',
  //auth,
  //requireRole('lead'),
  rejectCart
);

router.patch(
  '/:id/payment',
// auth,
//  requireRole('accounts'),
  markPaymentDone
);

router.patch(
  '/:id/deliver',
//  auth,
//  requireRole('accounts', 'lead'),
  confirmDelivery
);

router.delete(
  '/:id',
//  auth,
//  requireRole('lead'),
  deleteCart
);


router.get('/:id/delivery-checklist', getDeliveryChecklist);


export default router;

