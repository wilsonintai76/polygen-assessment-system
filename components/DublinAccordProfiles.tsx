import React from 'react';
import { DublinAccord } from '../types';
import { DublinAccordSection } from './DublinAccordSection';

export const DublinAccordDK: React.FC<{ standards: DublinAccord[] }> = ({ standards }) => (
  <DublinAccordSection standards={standards} profileType="DK" />
);

export const DublinAccordDP: React.FC<{ standards: DublinAccord[] }> = ({ standards }) => (
  <DublinAccordSection standards={standards} profileType="DP" />
);

export const DublinAccordNA: React.FC<{ standards: DublinAccord[] }> = ({ standards }) => (
  <DublinAccordSection standards={standards} profileType="NA" />
);
