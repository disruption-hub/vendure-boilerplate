import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.usersService.findAll(
      req.user.tenantId,
      pageNum,
      limitNum,
      search,
    );
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.usersService.findOne(id, req.user.tenantId);
  }

  @Post()
  async create(
    @Req() req: any,
    @Body()
    createUserDto: {
      primaryEmail: string;
      firstName?: string; walletAddress?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      password: string;
    },
  ) {
    return this.usersService.create(createUserDto, req.user.tenantId);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body()
    updateUserDto: {
      firstName?: string; walletAddress?: string;
      lastName?: string;
      phone?: string;
      role?: string;
    },
  ) {
    return this.usersService.update(id, updateUserDto, req.user.tenantId);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.usersService.remove(id, req.user.tenantId);
  }
}
