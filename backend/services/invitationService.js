const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

// Validate required environment variables
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  requiredEnvVars.SUPABASE_URL,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Resend
const resend = new Resend(requiredEnvVars.RESEND_API_KEY);

// Constants for validation
const VALID_ROLES = ['editor', 'viewer'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITATION_EXPIRY_DAYS = 7;

class InvitationService {
  /**
   * Validate invitation data
   * @param {Object} data - Invitation data to validate
   * @throws {Error} If validation fails
   */
  validateInvitationData(data) {
    const { email, role, projectId, projectName, inviterName, inviterId } = data;

    // Check required fields
    if (!email || !role || !projectId || !projectName || !inviterName || !inviterId) {
      throw new Error('Missing required fields: email, role, projectId, projectName, inviterName, inviterId');
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      throw new Error('Invalid email format');
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    // Validate UUIDs (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      throw new Error('Invalid project ID format');
    }
    if (!uuidRegex.test(inviterId)) {
      throw new Error('Invalid inviter ID format');
    }
  }

  /**
   * Send invitation to collaborator
   * @param {Object} invitationData - Invitation details
   * @param {string} invitationData.email - Invitee email
   * @param {string} invitationData.role - Role (editor/viewer)
   * @param {string} invitationData.projectId - Project ID
   * @param {string} invitationData.projectName - Project name
   * @param {string} invitationData.inviterName - Name of person sending invite
   * @param {string} invitationData.inviterId - UUID of person sending invite
   * @param {string} invitationData.message - Optional message
   * @returns {Promise<Object>} Result object
   */
  async sendInvitation(invitationData) {
    try {
      const { email, role, projectId, projectName, inviterName, inviterId, message } = invitationData;

      // Validate required fields
      this.validateInvitationData(invitationData);

      // Note: We don't check existing access here because:
      // 1. The user might not have an account yet
      // 2. We only check for pending invitations
      // 3. Access control is handled when the user accepts the invitation

      // Check if there's already a pending invitation
      const { data: existingInvitation, error: invitationError } = await supabase
        .from('project_invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', email)
        .eq('status', 'pending')
        .single();

      if (invitationError && invitationError.code !== 'PGRST116') {
        throw new Error(`Failed to check existing invitations: ${invitationError.message}`);
      }

      if (existingInvitation) {
        throw new Error('Invitation already sent to this email');
      }

      // Generate invitation token
      const invitationToken = this.generateInvitationToken();

      // Create invitation record in database
      const { data: invitation, error: createError } = await supabase
        .from('project_invitations')
        .insert({
          project_id: projectId,
          email: email,
          role: role,
          invited_by: inviterId,
          status: 'pending',
          token: invitationToken,
          expires_at: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create invitation: ${createError.message}`);
      }

      // Send email invitation
      const emailResult = await this.sendInvitationEmail({
        email,
        role,
        projectName,
        inviterName,
        message,
        invitationToken,
        projectId
      });

      if (!emailResult.success) {
        // If email fails, clean up the invitation record
        await supabase
          .from('project_invitations')
          .delete()
          .eq('id', invitation.id);
        
        throw new Error(`Failed to send email: ${emailResult.error}`);
      }

      return {
        success: true,
        invitationId: invitation.id,
        message: 'Invitation sent successfully'
      };

    } catch (error) {
      console.error('Invitation service error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send invitation email via Resend
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Result object
   */
  async sendInvitationEmail(emailData) {
    try {
      const { email, role, projectName, inviterName, message, invitationToken, projectId } = emailData;

      const invitationLink = `${process.env.FRONTEND_URL}/accept-invitation?token=${invitationToken}&project=${projectId}`;
      
      const emailHtml = this.generateInvitationEmailHtml({
        projectName,
        inviterName,
        role,
        message,
        invitationLink
      });

      const { data, error } = await resend.emails.send({
        from: 'Project Planner <noreply@solomonagyire.com>', // Use your verified domain
        to: [email],
        subject: `You're invited to collaborate on "${projectName}"`,
        html: emailHtml,
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error(`Resend error: ${error.message || 'Unknown error'}`);
      }

      return {
        success: true,
        emailId: data.id
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate invitation token
   * @returns {string} Random token
   */
  generateInvitationToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Generate HTML email template
   * @param {Object} data - Email data
   * @returns {string} HTML email
   */
  generateInvitationEmailHtml(data) {
    const { projectName, inviterName, role, message, invitationLink } = data;
    
    const roleText = role === 'editor' ? 'Editor' : 'Viewer';
    const roleDescription = role === 'editor' 
      ? 'You can view, edit, and manage project tasks' 
      : 'You can view project details and tasks';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Project Collaboration Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .role-badge { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
          .message-box { background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4f46e5; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 Project Collaboration Invitation</h1>
        </div>
        <div class="content">
          <h2>You're invited to collaborate!</h2>
          <p><strong>${inviterName}</strong> has invited you to collaborate on the project:</p>
          <h3 style="color: #4f46e5; margin: 20px 0;">"${projectName}"</h3>
          
          <p>Your role: <span class="role-badge">${roleText}</span></p>
          <p><em>${roleDescription}</em></p>
          
          ${message ? `
            <div class="message-box">
              <strong>Message from ${inviterName}:</strong><br>
              "${message}"
            </div>
          ` : ''}
          
          <p>Click the button below to accept this invitation:</p>
          <a href="${invitationLink}" class="button">Accept Invitation</a>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            This invitation will expire in 7 days. If you don't want to collaborate on this project, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>This invitation was sent from Project Planner</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = InvitationService;
