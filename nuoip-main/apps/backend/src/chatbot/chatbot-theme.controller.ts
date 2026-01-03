import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ChatbotThemeService } from './chatbot-theme.service';
// Assuming standard AuthGuard - adjusting based on generic nestjs structure
// Since I can't easily see Authentication strategy in detail, I'll attempt to use standard patterns
// If this fails compile, I can fix imports.
// 'src/auth/auth.module' exists, likely has JwtAuthGuard.
import { HybridAdminGuard } from '../common/guards/hybrid-auth.guard'

@Controller('chatbot/themes')
@UseGuards(HybridAdminGuard)
export class ChatbotThemeController {
    constructor(private readonly themeService: ChatbotThemeService) { }

    @Get()
    findAll(@Request() req) {
        return this.themeService.findAll(req.user.tenantId);
    }

    @Get('active')
    findActive(@Request() req) {
        return this.themeService.findActive(req.user.tenantId);
    }

    @Post()
    create(@Request() req, @Body() body: { name: string; colors: any; isActive?: boolean }) {
        if (!req.user.tenantId) {
            throw new BadRequestException('User does not belong to a tenant');
        }
        return this.themeService.create(req.user.tenantId, body);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() body: { name?: string; colors?: any }) {
        return this.themeService.update(id, req.user.tenantId, body);
    }

    @Post(':id/activate')
    setActive(@Request() req, @Param('id') id: string) {
        return this.themeService.setActive(id, req.user.tenantId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.themeService.remove(id, req.user.tenantId);
    }
}
