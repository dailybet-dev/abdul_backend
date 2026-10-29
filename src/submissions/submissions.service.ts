import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(emailValue: string) {
    const email = clean(emailValue, 254).toLowerCase();
    if (!EMAIL.test(email)) throw new BadRequestException('Enter a valid email address.');
    const existing = await this.prisma.newsletterSubscription.findUnique({ where: { email } });
    if (existing?.status === 'ACTIVE') return existing;
    if (existing) return this.prisma.newsletterSubscription.update({
      where: { email }, data: { status: 'ACTIVE', subscribedAt: new Date(), unsubscribedAt: null },
    });
    return this.prisma.newsletterSubscription.create({ data: { email } });
  }

  async submitContact(input: { name: string; email: string; phone?: string; service: string; message: string }) {
    const name = clean(input.name, 120);
    const email = clean(input.email, 254).toLowerCase();
    const phone = clean(input.phone, 40);
    const service = clean(input.service, 160);
    const message = clean(input.message, 5000);
    if (name.length < 2) throw new BadRequestException('Enter your full name.');
    if (!EMAIL.test(email)) throw new BadRequestException('Enter a valid email address.');
    if (!service) throw new BadRequestException('Choose what you need help with.');
    if (message.length < 5) throw new BadRequestException('Please provide a little more detail in your message.');
    return this.prisma.contactSubmission.create({ data: { name, email, phone, service, message } });
  }

  async submitTraining(input: { fullName: string; phone: string; email?: string; course: string; level: string; schedule: string; startDate?: string; goal?: string; notes?: string }) {
    const fullName = clean(input.fullName, 120);
    const phone = clean(input.phone, 40);
    const email = clean(input.email, 254).toLowerCase();
    const course = clean(input.course, 160);
    const level = clean(input.level, 100);
    const schedule = clean(input.schedule, 100);
    if (fullName.length < 2) throw new BadRequestException('Enter the student’s full name.');
    if (phone.length < 7) throw new BadRequestException('Enter a valid phone or WhatsApp number.');
    if (email && !EMAIL.test(email)) throw new BadRequestException('Enter a valid email address or leave it blank.');
    if (!course || !level || !schedule) throw new BadRequestException('Course, current skill level and preferred study time are required.');
    const startDate = clean(input.startDate, 20);
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new BadRequestException('Use a valid preferred start date.');
    return this.prisma.trainingEnquiry.create({ data: {
      fullName, phone, email, course, level, schedule, startDate,
      goal: clean(input.goal, 1000), notes: clean(input.notes, 5000),
    } });
  }

  listContacts(search = '', status = '') {
    const term = clean(search, 160);
    return this.prisma.contactSubmission.findMany({
      where: { ...(status ? { status: status as any } : {}), ...(term ? { OR: [
        { name: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } }, { service: { contains: term, mode: 'insensitive' } },
        { message: { contains: term, mode: 'insensitive' } },
      ] } : {}) }, orderBy: { createdAt: 'desc' },
    });
  }

  listTraining(search = '', status = '') {
    const term = clean(search, 160);
    return this.prisma.trainingEnquiry.findMany({
      where: { ...(status ? { status: status as any } : {}), ...(term ? { OR: [
        { fullName: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } }, { course: { contains: term, mode: 'insensitive' } },
        { goal: { contains: term, mode: 'insensitive' } },
      ] } : {}) }, orderBy: { createdAt: 'desc' },
    });
  }

  listNewsletter(search = '', status = '') {
    const term = clean(search, 160);
    return this.prisma.newsletterSubscription.findMany({
      where: { ...(status ? { status } : {}), ...(term ? { email: { contains: term, mode: 'insensitive' } } : {}) },
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async updateContact(id: string, status: string, adminNote?: string) {
    if (!['NEW', 'IN_PROGRESS', 'REPLIED', 'ARCHIVED'].includes(status)) throw new BadRequestException('Invalid enquiry status.');
    if (!await this.prisma.contactSubmission.findUnique({ where: { id } })) throw new NotFoundException('Contact submission not found.');
    return this.prisma.contactSubmission.update({ where: { id }, data: { status: status as any, ...(adminNote !== undefined ? { adminNote: clean(adminNote, 3000) } : {}) } });
  }

  async updateTraining(id: string, status: string, adminNote?: string) {
    if (!['NEW', 'IN_PROGRESS', 'REPLIED', 'ARCHIVED'].includes(status)) throw new BadRequestException('Invalid enquiry status.');
    if (!await this.prisma.trainingEnquiry.findUnique({ where: { id } })) throw new NotFoundException('Training enquiry not found.');
    return this.prisma.trainingEnquiry.update({ where: { id }, data: { status: status as any, ...(adminNote !== undefined ? { adminNote: clean(adminNote, 3000) } : {}) } });
  }

  async updateNewsletter(id: string, status: string) {
    if (!['ACTIVE', 'UNSUBSCRIBED'].includes(status)) throw new BadRequestException('Invalid subscription status.');
    if (!await this.prisma.newsletterSubscription.findUnique({ where: { id } })) throw new NotFoundException('Newsletter subscription not found.');
    return this.prisma.newsletterSubscription.update({ where: { id }, data: { status, unsubscribedAt: status === 'UNSUBSCRIBED' ? new Date() : null } });
  }

  async deleteContact(id: string) {
    if (!await this.prisma.contactSubmission.findUnique({ where: { id } })) throw new NotFoundException('Contact submission not found.');
    await this.prisma.contactSubmission.delete({ where: { id } }); return true;
  }
  async deleteTraining(id: string) {
    if (!await this.prisma.trainingEnquiry.findUnique({ where: { id } })) throw new NotFoundException('Training enquiry not found.');
    await this.prisma.trainingEnquiry.delete({ where: { id } }); return true;
  }
  async deleteNewsletter(id: string) {
    if (!await this.prisma.newsletterSubscription.findUnique({ where: { id } })) throw new NotFoundException('Newsletter subscription not found.');
    await this.prisma.newsletterSubscription.delete({ where: { id } }); return true;
  }
}
