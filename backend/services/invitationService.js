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

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to collaborate</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">

          <!-- Body -->
          <tr>
            <td style="padding:48px 48px 32px;">
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;letter-spacing:0.05em;text-transform:uppercase;font-weight:600;">Project Invitation</p>
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#09090b;line-height:1.3;">
                ${inviterName} invited you to collaborate
              </h1>
              <p style="margin:0 0 32px;font-size:16px;color:#3f3f46;line-height:1.6;">
                You've been added as an <strong>${roleText}</strong> on the project:
              </p>

              <!-- Project name block -->
              <div style="background:#fafafa;border:1px solid #e4e4e7;border-radius:6px;padding:16px 20px;margin-bottom:32px;">
                <p style="margin:0;font-size:18px;font-weight:600;color:#09090b;">${projectName}</p>
              </div>

              ${message ? `
              <!-- Personal message -->
              <div style="border-left:3px solid #e4e4e7;padding:4px 16px;margin-bottom:32px;">
                <p style="margin:0;font-size:14px;color:#71717a;font-style:italic;">"${message}"</p>
              </div>
              ` : ''}

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#18181b;border-radius:6px;">
                    <a href="${invitationLink}"
                       style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                This invitation expires in 7 days. If you weren't expecting this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:13px;color:#a1a1aa;">Sent via Project Planner</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

module.exports = InvitationService;
