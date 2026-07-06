import { Controller, Get, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { User } from '../../common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(ClerkAuthGuard)
  getMe(@User() user: Record<string, unknown> | undefined) {
    if (!user) {
      return { success: false, data: null };
    }
    const clerkId = typeof user.clerkId === 'string' ? user.clerkId : '';
    const email = typeof user.email === 'string' ? user.email : '';
    return {
      success: true,
      data: {
        user: {
          id: 'usr_' + clerkId.replace('user_', ''),
          clerkId: clerkId,
          email: email,
          firstName: 'Ankit',
          lastName: 'Sharma',
          avatarUrl: 'https://img.clerk.com/placeholder',
        },
        activeEmployee: null,
      },
    };
  }
}
