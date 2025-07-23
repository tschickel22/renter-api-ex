class SamlIdpController < ApplicationController
  include SamlIdp::Controller

  protect_from_forgery

  before_action :authenticate_user!, except: [:show]
  before_action :validate_saml_request, only: [:new, :create]

  def validate_saml_request
    if request.get?
      # params["SAMLRequest"] = session["SAMLRequest"]
    elsif request.post?
      session["SAMLRequest"] = params["SAMLRequest"]
      store_location_for("user", "#{request.base_url}/saml/auth") if current_user.blank?
    end

    super
  end

  def show
    render xml: SamlIdp.metadata.signed
  end

  def create
    if user_signed_in?
      @saml_response = idp_make_saml_response(current_user)
      render :template => "saml_idp/idp/saml_post", :layout => false
      return
    else
      # it shouldn't be possible to get here, but lets render 403 just in case
      render :status => :forbidden
    end
  end

  def logout
    redirect_to "/"
    # OLD idp_logout
    # OLD @saml_response = idp_make_saml_response(nil)
    # OLD render :template => "saml_idp/idp/saml_post", :layout => false
  end

  def idp_logout
    user = User.by_email(saml_request.name_id)
    user.logout
  end
  private :idp_logout

  def idp_authenticate(email, password)
    user = User.by_email(email).first
    user && user.valid_password?(password) ? user : nil
  end
  protected :idp_authenticate

  def idp_make_saml_response(found_user) # not using params intentionally
    encode_response found_user
  end
  private :idp_make_saml_response
end